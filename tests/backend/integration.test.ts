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

test("billing entitlements enforce free seat limits and retention windows", async () => {
  const context = loadSupabaseContext();
  const admin = createAdminClient(context);
  const stamp = Date.now() + 1;
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
  const stamp = Date.now() + 2;
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
