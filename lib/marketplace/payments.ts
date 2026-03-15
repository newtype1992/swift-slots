import Stripe from "stripe";

function paymentIntentId(value: Stripe.Checkout.Session["payment_intent"]) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

export async function syncBookingCheckoutCompleted(admin: any, session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") {
    return;
  }

  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    return;
  }

  const { error } = await admin.rpc("mark_slot_booking_paid", {
    p_booking_id: bookingId,
    p_checkout_session_id: session.id,
    p_payment_intent_id: paymentIntentId(session.payment_intent),
    p_amount_paid: session.amount_total ? session.amount_total / 100 : null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncBookingCheckoutExpired(admin: any, session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") {
    return;
  }

  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    return;
  }

  const { error } = await admin.rpc("cancel_slot_booking", {
    p_booking_id: bookingId,
    p_checkout_session_id: session.id,
  });

  if (error) {
    throw new Error(error.message);
  }
}
