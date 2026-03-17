import Stripe from "stripe";
import {
  sendConsumerBookingConfirmationEmail,
  sendConsumerCheckoutExpiredEmail,
  sendStudioBookingAlertEmail,
  type BookingEmailResult,
} from "@/lib/email/booking";

type MarketplaceAdminClient = any;

type BookingNotificationRow = {
  id: string;
  payment_status: string;
  amount_paid: number | null;
  consumer_user_id: string;
  consumer_confirmation_sent_at: string | null;
  studio_notification_sent_at: string | null;
  checkout_expired_notified_at: string | null;
  slots:
    | {
        id: string;
        class_type: string;
        start_time: string;
        available_spots: number;
        studios:
          | {
              id: string;
              name: string;
              location_text: string;
              operator_user_id: string;
            }
          | {
              id: string;
              name: string;
              location_text: string;
              operator_user_id: string;
            }[]
          | null;
      }
    | {
        id: string;
        class_type: string;
        start_time: string;
        available_spots: number;
        studios:
          | {
              id: string;
              name: string;
              location_text: string;
              operator_user_id: string;
            }
          | {
              id: string;
              name: string;
              location_text: string;
              operator_user_id: string;
            }[]
          | null;
      }[]
    | null;
};

type NotificationProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type BookingNotificationContext = {
  bookingId: string;
  paymentStatus: string;
  amountPaid: number | null;
  consumerEmail: string | null;
  consumerConfirmationSentAt: string | null;
  studioNotificationSentAt: string | null;
  checkoutExpiredNotifiedAt: string | null;
  slot: {
    id: string;
    classType: string;
    startTime: string;
    availableSpots: number;
    studio: {
      id: string;
      name: string;
      locationText: string;
      operatorUserId: string;
      operatorEmail: string | null;
    } | null;
  } | null;
};

type NotificationSenders = {
  sendConsumerBookingConfirmationEmail: typeof sendConsumerBookingConfirmationEmail;
  sendStudioBookingAlertEmail: typeof sendStudioBookingAlertEmail;
  sendConsumerCheckoutExpiredEmail: typeof sendConsumerCheckoutExpiredEmail;
};

const defaultSenders: NotificationSenders = {
  sendConsumerBookingConfirmationEmail,
  sendStudioBookingAlertEmail,
  sendConsumerCheckoutExpiredEmail,
};

function appOrigin() {
  return process.env.APP_URL || "http://localhost:3000";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(amount: number | null) {
  if (typeof amount !== "number") {
    return "CAD amount unavailable";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function paymentModeSession(session: Stripe.Checkout.Session) {
  return session.mode === "payment";
}

async function loadBookingNotificationContext(admin: MarketplaceAdminClient, bookingId: string) {
  const bookingQuery = admin
    .from("bookings")
    .select(
      "id, payment_status, amount_paid, consumer_user_id, consumer_confirmation_sent_at, studio_notification_sent_at, checkout_expired_notified_at, slots!inner(id, class_type, start_time, available_spots, studios!inner(id, name, location_text, operator_user_id))"
    )
    .eq("id", bookingId);
  const { data: booking, error } = (await bookingQuery.maybeSingle()) as {
    data: BookingNotificationRow | null;
    error: { message: string } | null;
  };

  if (error || !booking) {
    throw new Error(error?.message || "Booking notification context could not be loaded.");
  }

  const rawSlot = Array.isArray(booking.slots) ? booking.slots[0] ?? null : booking.slots;
  const rawStudio = rawSlot?.studios ? (Array.isArray(rawSlot.studios) ? rawSlot.studios[0] ?? null : rawSlot.studios) : null;
  const profileIds = [booking.consumer_user_id, rawStudio?.operator_user_id].filter(Boolean);
  const profilesQuery = admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", profileIds);
  const { data: profiles, error: profileError } = (await profilesQuery) as {
    data: NotificationProfile[] | null;
    error: { message: string } | null;
  };

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return {
    bookingId: booking.id,
    paymentStatus: booking.payment_status,
    amountPaid: booking.amount_paid === null ? null : Number(booking.amount_paid),
    consumerEmail: profileMap.get(booking.consumer_user_id)?.email ?? null,
    consumerConfirmationSentAt: booking.consumer_confirmation_sent_at,
    studioNotificationSentAt: booking.studio_notification_sent_at,
    checkoutExpiredNotifiedAt: booking.checkout_expired_notified_at,
    slot: rawSlot
      ? {
          id: rawSlot.id,
          classType: rawSlot.class_type,
          startTime: rawSlot.start_time,
          availableSpots: rawSlot.available_spots,
          studio: rawStudio
            ? {
                id: rawStudio.id,
                name: rawStudio.name,
                locationText: rawStudio.location_text,
                operatorUserId: rawStudio.operator_user_id,
                operatorEmail: profileMap.get(rawStudio.operator_user_id)?.email ?? null,
              }
            : null,
        }
      : null,
  } satisfies BookingNotificationContext;
}

async function markNotificationSent(
  admin: MarketplaceAdminClient,
  bookingId: string,
  column: "consumer_confirmation_sent_at" | "studio_notification_sent_at" | "checkout_expired_notified_at"
) {
  const { error } = await admin
    .from("bookings")
    .update({
      [column]: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .is(column, null);

  if (error) {
    throw new Error(error.message);
  }
}

function logNotificationFailure(label: string, result: Exclude<BookingEmailResult, { status: "sent" }>) {
  const method = result.status === "failed" ? console.error : console.warn;
  method(`[notifications] ${label}: ${result.reason}`);
}

export async function syncBookingCompletedNotifications(
  admin: MarketplaceAdminClient,
  session: Stripe.Checkout.Session,
  senders: NotificationSenders = defaultSenders
) {
  if (!paymentModeSession(session)) {
    return;
  }

  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    return;
  }

  const context = await loadBookingNotificationContext(admin, bookingId);

  if (!context.slot || !context.slot.studio) {
    return;
  }

  const bookingUrl = `${appOrigin()}/marketplace/bookings/${context.bookingId}`;
  const marketplaceUrl = `${appOrigin()}/marketplace`;
  const startTimeLabel = formatDateTime(context.slot.startTime);
  const amountPaidLabel = formatMoney(context.amountPaid);

  if (context.consumerEmail && !context.consumerConfirmationSentAt) {
    const result = await senders.sendConsumerBookingConfirmationEmail({
      consumerEmail: context.consumerEmail,
      studioName: context.slot.studio.name,
      studioLocation: context.slot.studio.locationText,
      classType: context.slot.classType,
      startTimeLabel,
      amountPaidLabel,
      bookingUrl,
      marketplaceUrl,
    });

    if (result.status === "sent") {
      await markNotificationSent(admin, context.bookingId, "consumer_confirmation_sent_at");
    } else {
      logNotificationFailure("consumer booking confirmation", result);
    }
  }

  if (context.slot.studio.operatorEmail && !context.studioNotificationSentAt) {
    const result = await senders.sendStudioBookingAlertEmail({
      studioOperatorEmail: context.slot.studio.operatorEmail,
      consumerEmail: context.consumerEmail || "Unknown consumer",
      studioName: context.slot.studio.name,
      classType: context.slot.classType,
      startTimeLabel,
      amountPaidLabel,
      remainingSpots: context.slot.availableSpots,
      marketplaceUrl,
    });

    if (result.status === "sent") {
      await markNotificationSent(admin, context.bookingId, "studio_notification_sent_at");
    } else {
      logNotificationFailure("studio booking alert", result);
    }
  }
}

export async function syncBookingExpiredNotifications(
  admin: MarketplaceAdminClient,
  session: Stripe.Checkout.Session,
  senders: NotificationSenders = defaultSenders
) {
  if (!paymentModeSession(session)) {
    return;
  }

  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    return;
  }

  const context = await loadBookingNotificationContext(admin, bookingId);

  if (!context.slot || !context.slot.studio || !context.consumerEmail || context.checkoutExpiredNotifiedAt) {
    return;
  }

  const result = await senders.sendConsumerCheckoutExpiredEmail({
    consumerEmail: context.consumerEmail,
    studioName: context.slot.studio.name,
    studioLocation: context.slot.studio.locationText,
    classType: context.slot.classType,
    startTimeLabel: formatDateTime(context.slot.startTime),
    marketplaceUrl: `${appOrigin()}/marketplace`,
  });

  if (result.status === "sent") {
    await markNotificationSent(admin, context.bookingId, "checkout_expired_notified_at");
  } else {
    logNotificationFailure("consumer checkout expired", result);
  }
}
