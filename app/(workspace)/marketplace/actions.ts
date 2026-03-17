"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { discountedPrice, getBookingConfirmation } from "@/lib/marketplace/server";
import { createStripeServerClient, stripeIsConfigured } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isNextRedirectError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function resolveRedirectTarget(formData: FormData, fallbackPath: string) {
  const redirectTo = String(formData.get("redirectTo") || "").trim();

  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }

  return fallbackPath;
}

function withFlash(path: string, type: "error" | "message", value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(type, value);
  return `${url.pathname}${url.search}`;
}

async function requireAuthenticatedConsumer() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?error=You%20must%20sign%20in%20first.&next=%2Fmarketplace");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "studio_operator" | "consumer" }>();

  if (error || !profile || profile.role !== "consumer") {
    redirect("/settings/profile?error=Switch%20this%20account%20to%20Consumer%20to%20book%20marketplace%20slots.");
  }

  return { supabase, user, profile };
}

export async function createBookingAction(formData: FormData) {
  const slotId = String(formData.get("slotId") || "").trim();
  const fallback = slotId ? `/marketplace/${slotId}` : "/marketplace";
  const redirectTo = resolveRedirectTarget(formData, fallback);
  const { supabase, user } = await requireAuthenticatedConsumer();

  if (!stripeIsConfigured()) {
    redirect(withFlash(redirectTo, "error", "Stripe is not configured yet for booking payments."));
  }

  const { data, error } = await supabase
    .rpc("create_slot_booking", {
      p_slot_id: slotId,
    })
    .single<{ id: string }>();

  if (error || !data?.id) {
    redirect(withFlash(redirectTo, "error", error?.message || "Unable to create booking."));
  }

  const booking = await getBookingConfirmation({
    supabase,
    bookingId: data.id,
  });

  if (!booking?.slot || !booking.slot.studio) {
    const admin = createSupabaseAdminClient();
    await admin.rpc("cancel_slot_booking", {
      p_booking_id: data.id,
      p_checkout_session_id: null,
    });
    redirect(withFlash(redirectTo, "error", "The booking could not be prepared for checkout."));
  }

  const stripe = createStripeServerClient();
  const origin = (await headers()).get("origin") || process.env.APP_URL || "http://localhost:3000";
  const unitAmount = Math.round(discountedPrice(booking.slot.original_price, booking.slot.discount_percent) * 100);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      success_url: `${origin}/marketplace/bookings/${booking.id}?message=Payment%20received.`,
      cancel_url: `${origin}${withFlash(
        redirectTo,
        "message",
        "Checkout canceled. The reservation will release automatically if payment is not completed."
      )}`,
      metadata: {
        booking_id: booking.id,
        slot_id: booking.slot.id,
        studio_id: booking.slot.studio.id,
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          slot_id: booking.slot.id,
          studio_id: booking.slot.studio.id,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: unitAmount,
            product_data: {
              name: `${booking.slot.class_type} - ${booking.slot.studio.name}`,
              description: `${booking.slot.studio.location_text} - ${booking.slot.discount_percent}% off`,
            },
          },
        },
      ],
    });

    const admin = createSupabaseAdminClient();
    const { error: updateError } = await admin
      .from("bookings")
      .update({
        provider_checkout_session_id: session.id,
        checkout_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      })
      .eq("id", booking.id)
      .eq("payment_status", "pending");

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!session.url) {
      throw new Error("Stripe checkout did not return a redirect URL.");
    }

    redirect(session.url);
  } catch (checkoutError) {
    if (isNextRedirectError(checkoutError)) {
      throw checkoutError;
    }

    const admin = createSupabaseAdminClient();
    await admin.rpc("cancel_slot_booking", {
      p_booking_id: booking.id,
      p_checkout_session_id: null,
    });

    redirect(
      withFlash(
        redirectTo,
        "error",
        checkoutError instanceof Error ? checkoutError.message : "Unable to start Stripe checkout."
      )
    );
  }
}
