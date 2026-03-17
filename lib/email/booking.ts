import { Resend } from "resend";
import { requiredEmailEnv, renderEmailShell, type EmailDeliveryResult } from "./shared";

type BookingEmailBase = {
  consumerEmail: string;
  studioName: string;
  studioLocation: string;
  classType: string;
  startTimeLabel: string;
  bookingUrl?: string;
  marketplaceUrl?: string;
};

type ConsumerBookingConfirmationInput = BookingEmailBase & {
  amountPaidLabel: string;
};

type StudioBookingAlertInput = {
  studioOperatorEmail: string;
  consumerEmail: string;
  studioName: string;
  classType: string;
  startTimeLabel: string;
  amountPaidLabel: string;
  remainingSpots: number;
  marketplaceUrl?: string;
};

type ConsumerCheckoutExpiredInput = BookingEmailBase;

export type BookingEmailResult = EmailDeliveryResult;

function configOrSkip(reason: string) {
  return requiredEmailEnv(reason);
}

export async function sendConsumerBookingConfirmationEmail(
  input: ConsumerBookingConfirmationInput
): Promise<BookingEmailResult> {
  const env = configOrSkip("Booking completed, but email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");

  if (!env.ok) {
    return { status: "skipped", reason: env.reason };
  }

  try {
    const resend = new Resend(env.apiKey);

    await resend.emails.send({
      from: env.from,
      to: input.consumerEmail,
      subject: `Booking confirmed for ${input.classType}`,
      text: [
        `Your Swift Slots booking for ${input.classType} is confirmed.`,
        "",
        `Studio: ${input.studioName}`,
        `Address: ${input.studioLocation}`,
        `Starts: ${input.startTimeLabel}`,
        `Amount paid: ${input.amountPaidLabel}`,
        input.bookingUrl ? `View booking: ${input.bookingUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      html: renderEmailShell({
        eyebrow: "Booking confirmed",
        title: input.classType,
        body: [
          `Your Swift Slots booking is confirmed at ${input.studioName}.`,
          `Starts ${input.startTimeLabel}. You paid ${input.amountPaidLabel}.`,
          `Studio address: ${input.studioLocation}.`,
        ],
        actionLabel: input.bookingUrl ? "View booking" : undefined,
        actionUrl: input.bookingUrl,
      }),
    });

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Consumer booking confirmation email failed unexpectedly.",
    };
  }
}

export async function sendStudioBookingAlertEmail(input: StudioBookingAlertInput): Promise<BookingEmailResult> {
  const env = configOrSkip("Booking alert created, but email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");

  if (!env.ok) {
    return { status: "skipped", reason: env.reason };
  }

  try {
    const resend = new Resend(env.apiKey);

    await resend.emails.send({
      from: env.from,
      to: input.studioOperatorEmail,
      subject: `New booking for ${input.classType}`,
      text: [
        `A new booking was completed for ${input.classType}.`,
        "",
        `Studio: ${input.studioName}`,
        `Consumer: ${input.consumerEmail}`,
        `Starts: ${input.startTimeLabel}`,
        `Amount paid: ${input.amountPaidLabel}`,
        `Remaining spots: ${input.remainingSpots}`,
        input.marketplaceUrl ? `Open marketplace: ${input.marketplaceUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      html: renderEmailShell({
        eyebrow: "Studio booking alert",
        title: `New booking for ${input.classType}`,
        body: [
          `${input.consumerEmail} completed a booking at ${input.studioName}.`,
          `Starts ${input.startTimeLabel}. Amount paid: ${input.amountPaidLabel}.`,
          `Remaining spots after booking: ${input.remainingSpots}.`,
        ],
        actionLabel: input.marketplaceUrl ? "Open marketplace" : undefined,
        actionUrl: input.marketplaceUrl,
      }),
    });

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Studio booking alert email failed unexpectedly.",
    };
  }
}

export async function sendConsumerCheckoutExpiredEmail(
  input: ConsumerCheckoutExpiredInput
): Promise<BookingEmailResult> {
  const env = configOrSkip("Checkout expired, but email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");

  if (!env.ok) {
    return { status: "skipped", reason: env.reason };
  }

  try {
    const resend = new Resend(env.apiKey);

    await resend.emails.send({
      from: env.from,
      to: input.consumerEmail,
      subject: `Checkout expired for ${input.classType}`,
      text: [
        `Your checkout for ${input.classType} at ${input.studioName} expired before payment completed.`,
        "",
        `Studio address: ${input.studioLocation}`,
        `Class start: ${input.startTimeLabel}`,
        input.marketplaceUrl ? `Browse available classes again: ${input.marketplaceUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      html: renderEmailShell({
        eyebrow: "Checkout expired",
        title: `${input.classType} was not confirmed`,
        body: [
          `Your payment session for ${input.classType} at ${input.studioName} expired before checkout completed.`,
          `Class start: ${input.startTimeLabel}. Studio address: ${input.studioLocation}.`,
          "If the slot is still available, you can return to the marketplace and try again.",
        ],
        actionLabel: input.marketplaceUrl ? "Browse marketplace" : undefined,
        actionUrl: input.marketplaceUrl,
      }),
    });

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Checkout expired email failed unexpectedly.",
    };
  }
}

