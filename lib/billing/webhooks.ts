import Stripe from "stripe";
import { normalizePlanKey } from "./plans";
import { recordOrganizationActivity } from "./server";

function timestampToIso(value: number | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

export async function findOrganizationIdForSubscription(admin: any, subscription: Stripe.Subscription) {
  const metadataOrganizationId = subscription.metadata.organization_id;

  if (metadataOrganizationId) {
    return metadataOrganizationId;
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const subscriptionId = subscription.id;
  const { data, error } = await admin
    .from("subscriptions")
    .select("organization_id")
    .or(`provider_subscription_id.eq.${subscriptionId},provider_customer_id.eq.${customerId}`)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.organization_id ?? null;
}

export async function syncStripeSubscription(admin: any, subscription: Stripe.Subscription) {
  const organizationId = await findOrganizationIdForSubscription(admin, subscription);

  if (!organizationId) {
    throw new Error(`Unable to resolve organization for Stripe subscription ${subscription.id}`);
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const currentPlanKey = normalizePlanKey(subscription.metadata.plan_key);
  const primaryItem = subscription.items.data[0];
  const { data: existingSubscription, error: existingError } = await admin
    .from("subscriptions")
    .select("id, plan_key, status")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      provider: "stripe",
      provider_customer_id: customerId,
      provider_subscription_id: subscription.id,
      plan_key: currentPlanKey,
      status: subscription.status,
      current_period_start: timestampToIso(primaryItem?.current_period_start),
      current_period_end: timestampToIso(primaryItem?.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      billing_email: null,
    },
    {
      onConflict: "organization_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  const action =
    subscription.status === "canceled"
      ? "billing.subscription_canceled"
      : existingSubscription
        ? "billing.subscription_updated"
        : "billing.subscription_created";

  await recordOrganizationActivity(admin, {
    organizationId,
    action,
    entityType: "subscription",
    metadata: {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      previous_plan_key: existingSubscription?.plan_key ?? null,
      new_plan_key: currentPlanKey,
      previous_status: existingSubscription?.status ?? null,
      new_status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
  });
}

export async function syncCheckoutCompletion(admin: any, session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") {
    return;
  }

  const organizationId = session.metadata?.organization_id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!organizationId || !customerId) {
    return;
  }

  const { error } = await admin
    .from("subscriptions")
    .update({
      provider_customer_id: customerId,
    })
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  await recordOrganizationActivity(admin, {
    organizationId,
    action: "billing.checkout_completed",
    entityType: "subscription",
    metadata: {
      stripe_customer_id: customerId,
      stripe_checkout_session_id: session.id,
      requested_plan_key: session.metadata?.plan_key ?? null,
    },
  });
}
