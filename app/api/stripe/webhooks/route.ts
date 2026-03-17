import { NextResponse } from "next/server";
import Stripe from "stripe";
import { syncCheckoutCompletion, syncStripeSubscription } from "@/lib/billing/webhooks";
import { syncBookingCompletedNotifications, syncBookingExpiredNotifications } from "@/lib/marketplace/notifications";
import { syncBookingCheckoutCompleted, syncBookingCheckoutExpired } from "@/lib/marketplace/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createStripeServerClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const payload = await request.text();
    const stripe = createStripeServerClient();
    const event = stripe.webhooks.constructEvent(payload, signature, requiredEnv("STRIPE_WEBHOOK_SECRET"));
    const admin = createSupabaseAdminClient();

    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckoutCompletion(admin, event.data.object as Stripe.Checkout.Session);
        await syncBookingCheckoutCompleted(admin, event.data.object as Stripe.Checkout.Session);
        try {
          await syncBookingCompletedNotifications(admin, event.data.object as Stripe.Checkout.Session);
        } catch (notificationError) {
          console.error("[stripe webhook] booking completion notifications failed", notificationError);
        }
        break;
      case "checkout.session.expired":
        await syncBookingCheckoutExpired(admin, event.data.object as Stripe.Checkout.Session);
        try {
          await syncBookingExpiredNotifications(admin, event.data.object as Stripe.Checkout.Session);
        } catch (notificationError) {
          console.error("[stripe webhook] booking expiry notifications failed", notificationError);
        }
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Stripe webhook failed.",
      },
      { status: 400 }
    );
  }
}
