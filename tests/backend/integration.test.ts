import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  buildEntitlementSummary,
  filterByHistoryWindow,
  getOrganizationBillingUsage,
  getOrganizationSubscription,
} from "../../lib/billing/server";
import { syncCheckoutCompletion, syncStripeSubscription } from "../../lib/billing/webhooks";

type EnvMap = Record<string, string>;

type AuthenticatedClient = ReturnType<typeof createClient>;

type OrganizationRecord = {
  id: string;
  slug: string;
};

function parseShellEnv(input: string) {
  return Object.fromEntries(
    input
      .split(/\r?\n/)
      .filter((line) => line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex);
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^"/, "").replace(/"$/, "");
        return [key, value];
      })
  ) as EnvMap;
}

function loadSupabaseContext() {
  const envOutput = execFileSync("supabase", ["status", "-o", "env"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const env = parseShellEnv(envOutput);

  return {
    apiUrl: env.API_URL,
    anonKey: env.ANON_KEY,
    serviceRoleKey: env.SERVICE_ROLE_KEY,
  };
}

function createAnonClient(context: ReturnType<typeof loadSupabaseContext>) {
  return createClient(context.apiUrl, context.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function createAdminClient(context: ReturnType<typeof loadSupabaseContext>) {
  return createClient(context.apiUrl, context.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function signUpAndSignIn(context: ReturnType<typeof loadSupabaseContext>, email: string) {
  const client = createAnonClient(context);
  const password = "password123";
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    const signIn = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (signIn.error) {
      throw signIn.error;
    }
  }

  return client;
}

async function createOrganization(client: AuthenticatedClient, name: string, slug: string) {
  const { data, error } = await client
    .rpc("create_organization", {
      p_name: name,
      p_slug: slug,
    })
    .single<OrganizationRecord>();

  if (error || !data) {
    throw error ?? new Error("Organization was not created.");
  }

  return data;
}

async function acceptInvite(client: AuthenticatedClient, token: string) {
  const { error } = await client.rpc("accept_organization_invite", {
    p_token: token,
  });

  if (error) {
    throw error;
  }
}

function makeCheckoutSession(organizationId: string, customerId: string, planKey: string): Stripe.Checkout.Session {
  return {
    id: `cs_test_${organizationId.replace(/-/g, "")}`,
    object: "checkout.session",
    mode: "subscription",
    metadata: {
      organization_id: organizationId,
      plan_key: planKey,
    },
    customer: customerId,
  } as Stripe.Checkout.Session;
}

function makeSubscription(
  organizationId: string,
  customerId: string,
  subscriptionId: string,
  planKey: string,
  status: Stripe.Subscription.Status
): Stripe.Subscription {
  return {
    id: subscriptionId,
    object: "subscription",
    customer: customerId,
    status,
    cancel_at_period_end: false,
    metadata: {
      organization_id: organizationId,
      plan_key: planKey,
    },
    items: {
      object: "list",
      data: [
        {
          id: `si_${subscriptionId}`,
          object: "subscription_item",
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        },
      ],
      has_more: false,
      url: "/v1/subscription_items",
    },
  } as Stripe.Subscription;
}

test("org and membership RPCs enforce roles and protect direct writes", async () => {
  const context = loadSupabaseContext();
  const stamp = Date.now();
  const ownerClient = await signUpAndSignIn(context, `owner-${stamp}@example.com`);
  const memberClient = await signUpAndSignIn(context, `member-${stamp}@example.com`);
  const organization = await createOrganization(ownerClient, `Org ${stamp}`, `org-${stamp}`);

  const inviteResponse = await ownerClient
    .rpc("invite_organization_member", {
      p_organization_id: organization.id,
      p_email: `member-${stamp}@example.com`,
      p_role: "member",
    })
    .single<{ token: string }>();

  assert.equal(inviteResponse.error, null);
  assert.ok(inviteResponse.data?.token);

  await acceptInvite(memberClient, inviteResponse.data!.token);

  const memberInviteAttempt = await memberClient.rpc("invite_organization_member", {
    p_organization_id: organization.id,
    p_email: `blocked-${stamp}@example.com`,
    p_role: "member",
  });
  assert.ok(memberInviteAttempt.error);

  const directActivityInsert = await memberClient.from("activity_logs").insert({
    organization_id: organization.id,
    action: "forged.event",
    entity_type: "organization",
    metadata: {},
  });
  assert.ok(directActivityInsert.error);

  const directSubscriptionUpdate = await ownerClient
    .from("subscriptions")
    .update({ plan_key: "business" })
    .eq("organization_id", organization.id);
  assert.ok(directSubscriptionUpdate.error);
});

test("swift slots schema enforces roles, marketplace visibility, and booking boundaries", async () => {
  const context = loadSupabaseContext();
  const admin = createAdminClient(context);
  const stamp = Date.now() + 1;
  const operatorClient = await signUpAndSignIn(context, `studio-operator-${stamp}@example.com`);
  const consumerClient = await signUpAndSignIn(context, `consumer-${stamp}@example.com`);

  const {
    data: { user: operatorUser },
  } = await operatorClient.auth.getUser();
  const {
    data: { user: consumerUser },
  } = await consumerClient.auth.getUser();

  assert.ok(operatorUser?.id);
  assert.ok(consumerUser?.id);

  const promoteOperator = await admin
    .from("profiles")
    .update({ role: "studio_operator" })
    .eq("id", operatorUser!.id);
  assert.equal(promoteOperator.error, null);

  const consumerStudioAttempt = await consumerClient.from("studios").insert({
    operator_user_id: consumerUser!.id,
    name: `Consumer Studio ${stamp}`,
    slug: `consumer-studio-${stamp}`,
    location_text: "123 Test Street, Montreal",
    class_categories: ["Yoga"],
  });
  assert.ok(consumerStudioAttempt.error);

  const studioInsert = await operatorClient
    .from("studios")
    .insert({
      operator_user_id: operatorUser!.id,
      name: `Operator Studio ${stamp}`,
      slug: `operator-studio-${stamp}`,
      location_text: "456 Fitness Avenue, Montreal",
      class_categories: ["Yoga", "Pilates"],
    })
    .select("id")
    .single<{ id: string }>();
  assert.equal(studioInsert.error, null);
  assert.ok(studioInsert.data?.id);

  const openSlotInsert = await operatorClient
    .from("slots")
    .insert({
      studio_id: studioInsert.data!.id,
      class_type: "Yoga Flow",
      start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      class_length_minutes: 60,
      original_price: 30,
      discount_percent: 25,
      available_spots: 2,
      status: "open",
    })
    .select("id")
    .single<{ id: string }>();
  assert.equal(openSlotInsert.error, null);

  const openSlotForConsumer = await consumerClient.from("slots").select("id").eq("id", openSlotInsert.data!.id).maybeSingle();
  assert.equal(openSlotForConsumer.error, null);
  assert.equal(openSlotForConsumer.data?.id, openSlotInsert.data!.id);

  const lockedSoonSlotInsert = await operatorClient
    .from("slots")
    .insert({
      studio_id: studioInsert.data!.id,
      class_type: "Power Pilates",
      start_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      class_length_minutes: 45,
      original_price: 35,
      discount_percent: 20,
      available_spots: 1,
      status: "open",
    })
    .select("id")
    .single<{ id: string }>();
  assert.equal(lockedSoonSlotInsert.error, null);

  const lockedSoonSlotForConsumer = await consumerClient.from("slots").select("id").eq("id", lockedSoonSlotInsert.data!.id);
  assert.equal(lockedSoonSlotForConsumer.error, null);
  assert.equal(lockedSoonSlotForConsumer.data?.length, 0);

  const lockedSoonSlotForOperator = await operatorClient
    .from("slots")
    .select("id")
    .eq("id", lockedSoonSlotInsert.data!.id)
    .maybeSingle();
  assert.equal(lockedSoonSlotForOperator.error, null);
  assert.equal(lockedSoonSlotForOperator.data?.id, lockedSoonSlotInsert.data!.id);

  const directBookingAttempt = await consumerClient.from("bookings").insert({
    slot_id: openSlotInsert.data!.id,
    consumer_user_id: consumerUser!.id,
    payment_status: "pending",
  });
  assert.ok(directBookingAttempt.error);

  const operatorBookingAttempt = await operatorClient.rpc("create_slot_booking", {
    p_slot_id: openSlotInsert.data!.id,
  });
  assert.ok(operatorBookingAttempt.error);

  const bookingResponse = await consumerClient
    .rpc("create_slot_booking", {
      p_slot_id: openSlotInsert.data!.id,
    })
    .single<{ id: string }>();
  assert.equal(bookingResponse.error, null);
  assert.ok(bookingResponse.data?.id);

  const duplicateBookingAttempt = await consumerClient.rpc("create_slot_booking", {
    p_slot_id: openSlotInsert.data!.id,
  });
  assert.ok(duplicateBookingAttempt.error);

  const slotAfterBooking = await operatorClient
    .from("slots")
    .select("available_spots, status")
    .eq("id", openSlotInsert.data!.id)
    .maybeSingle<{ available_spots: number; status: string }>();
  assert.equal(slotAfterBooking.error, null);
  assert.equal(slotAfterBooking.data?.available_spots, 1);
  assert.equal(slotAfterBooking.data?.status, "open");

  const markPaid = await admin
    .rpc("mark_slot_booking_paid", {
      p_booking_id: bookingResponse.data!.id,
      p_checkout_session_id: "cs_marketplace_paid",
      p_payment_intent_id: "pi_marketplace_paid",
      p_amount_paid: 22.5,
    })
    .single<{ id: string; payment_status: string; amount_paid: number }>();
  assert.equal(markPaid.error, null);
  assert.equal(markPaid.data?.payment_status, "paid");
  assert.equal(markPaid.data?.amount_paid, 22.5);

  const cancelableSlotInsert = await operatorClient
    .from("slots")
    .insert({
      studio_id: studioInsert.data!.id,
      class_type: "Noon Strength",
      start_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      class_length_minutes: 50,
      original_price: 40,
      discount_percent: 15,
      available_spots: 1,
      status: "open",
    })
    .select("id")
    .single<{ id: string }>();
  assert.equal(cancelableSlotInsert.error, null);

  const cancelableBooking = await consumerClient
    .rpc("create_slot_booking", {
      p_slot_id: cancelableSlotInsert.data!.id,
    })
    .single<{ id: string }>();
  assert.equal(cancelableBooking.error, null);

  const cancelBooking = await admin
    .rpc("cancel_slot_booking", {
      p_booking_id: cancelableBooking.data!.id,
      p_checkout_session_id: "cs_marketplace_expired",
    })
    .single<{ id: string; payment_status: string }>();
  assert.equal(cancelBooking.error, null);
  assert.equal(cancelBooking.data?.payment_status, "canceled");

  const slotAfterCancel = await operatorClient
    .from("slots")
    .select("available_spots, status")
    .eq("id", cancelableSlotInsert.data!.id)
    .maybeSingle<{ available_spots: number; status: string }>();
  assert.equal(slotAfterCancel.error, null);
  assert.equal(slotAfterCancel.data?.available_spots, 1);
  assert.equal(slotAfterCancel.data?.status, "open");

  const forbiddenSlotEdit = await operatorClient
    .from("slots")
    .update({ class_type: "Edited Class Name" })
    .eq("id", openSlotInsert.data!.id);
  assert.ok(forbiddenSlotEdit.error);

  const allowedStatusUpdate = await operatorClient
    .from("slots")
    .update({ status: "filled" })
    .eq("id", openSlotInsert.data!.id);
  assert.equal(allowedStatusUpdate.error, null);

  const bookingVisibleToOperator = await operatorClient
    .from("bookings")
    .select("id")
    .eq("id", bookingResponse.data!.id)
    .maybeSingle();
  assert.equal(bookingVisibleToOperator.error, null);
  assert.equal(bookingVisibleToOperator.data?.id, bookingResponse.data!.id);
});

test("billing entitlements enforce free seat limits and retention windows", async () => {
  const context = loadSupabaseContext();
  const admin = createAdminClient(context);
  const stamp = Date.now() + 2;
  const ownerClient = await signUpAndSignIn(context, `entitled-owner-${stamp}@example.com`);
  const memberClient = await signUpAndSignIn(context, `entitled-member-${stamp}@example.com`);
  const organization = await createOrganization(ownerClient, `Entitled Org ${stamp}`, `entitled-org-${stamp}`);

  const acceptedInvite = await ownerClient
    .rpc("invite_organization_member", {
      p_organization_id: organization.id,
      p_email: `entitled-member-${stamp}@example.com`,
      p_role: "member",
    })
    .single<{ token: string }>();
  assert.equal(acceptedInvite.error, null);
  await acceptInvite(memberClient, acceptedInvite.data!.token);

  const pendingInvite = await ownerClient.rpc("invite_organization_member", {
    p_organization_id: organization.id,
    p_email: `pending-${stamp}@example.com`,
    p_role: "member",
  });
  assert.equal(pendingInvite.error, null);

  const subscription = await getOrganizationSubscription(ownerClient, organization.id);
  const usage = await getOrganizationBillingUsage(ownerClient, organization.id);
  const summary = buildEntitlementSummary(subscription, usage);

  assert.equal(subscription.plan_key, "free");
  assert.equal(subscription.status, "active");
  assert.equal(summary.usage.seatsUsed, 3);
  assert.equal(summary.seatsRemaining, 0);
  assert.equal(summary.canInviteMore, false);
  assert.equal(summary.historyWindowDays, 30);

  const inserted = await admin
    .from("activity_logs")
    .insert([
      {
        organization_id: organization.id,
        actor_user_id: null,
        action: "billing.recent_event",
        entity_type: "subscription",
        metadata: {},
      },
      {
        organization_id: organization.id,
        actor_user_id: null,
        action: "billing.old_event",
        entity_type: "subscription",
        metadata: {},
      },
    ])
    .select("id, created_at, action");
  assert.equal(inserted.error, null);
  assert.equal(inserted.data?.length, 2);

  const oldLogId = inserted.data!.find((row) => row.action === "billing.old_event")!.id;
  const oldTimestamp = new Date();
  oldTimestamp.setDate(oldTimestamp.getDate() - 45);
  const updatedOldLog = await admin
    .from("activity_logs")
    .update({ created_at: oldTimestamp.toISOString() })
    .eq("id", oldLogId);
  assert.equal(updatedOldLog.error, null);

  const activityLogs = await ownerClient
    .from("activity_logs")
    .select("created_at, action")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });
  assert.equal(activityLogs.error, null);

  const retainedLogs = filterByHistoryWindow(activityLogs.data ?? [], summary.historyWindowDays);
  assert.ok(retainedLogs.some((row) => row.action === "billing.recent_event"));
  assert.ok(!retainedLogs.some((row) => row.action === "billing.old_event"));
});

test("webhook sync updates subscriptions and records billing activity", async () => {
  const context = loadSupabaseContext();
  const admin = createAdminClient(context);
  const stamp = Date.now() + 3;
  const ownerClient = await signUpAndSignIn(context, `billing-owner-${stamp}@example.com`);
  const organization = await createOrganization(ownerClient, `Billing Org ${stamp}`, `billing-org-${stamp}`);
  const customerId = `cus_test_${stamp}`;
  const subscriptionId = `sub_test_${stamp}`;

  await syncCheckoutCompletion(admin, makeCheckoutSession(organization.id, customerId, "pro"));
  await syncStripeSubscription(admin, makeSubscription(organization.id, customerId, subscriptionId, "pro", "active"));

  const subscription = await admin
    .from("subscriptions")
    .select("provider_customer_id, provider_subscription_id, plan_key, status")
    .eq("organization_id", organization.id)
    .maybeSingle();
  assert.equal(subscription.error, null);
  assert.equal(subscription.data?.provider_customer_id, customerId);
  assert.equal(subscription.data?.provider_subscription_id, subscriptionId);
  assert.equal(subscription.data?.plan_key, "pro");
  assert.equal(subscription.data?.status, "active");

  const activity = await admin
    .from("activity_logs")
    .select("action, metadata")
    .eq("organization_id", organization.id)
    .in("action", ["billing.checkout_completed", "billing.subscription_updated"]);
  assert.equal(activity.error, null);
  assert.ok(activity.data?.some((row) => row.action === "billing.checkout_completed"));
  assert.ok(activity.data?.some((row) => row.action === "billing.subscription_updated"));
});
