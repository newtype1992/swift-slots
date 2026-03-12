import { getEffectivePlan, getPlanDefinition, type SubscriptionSnapshot } from "@/lib/billing/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type BillingSnapshot = SubscriptionSnapshot & {
  organization_id: string;
};

export type BillingUsage = {
  memberCount: number;
  pendingInviteCount: number;
  seatsUsed: number;
};

export async function getOrganizationSubscription(
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: <T>() => Promise<{ data: T | null; error: { message: string } | null }>;
        };
      };
    };
  } | any,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "organization_id, plan_key, status, cancel_at_period_end, current_period_end, provider_customer_id, provider_subscription_id"
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      organization_id: organizationId,
      plan_key: "free",
      status: "active",
      cancel_at_period_end: false,
      current_period_end: null,
      provider_customer_id: null,
      provider_subscription_id: null,
    } satisfies BillingSnapshot;
  }

  return data as BillingSnapshot;
}

export async function getOrganizationBillingUsage(
  supabase: any,
  organizationId: string
): Promise<BillingUsage> {
  const [{ data: members }, { count, error }] = await Promise.all([
    supabase
      .rpc("get_organization_members", {
        p_organization_id: organizationId,
      })
      .returns(),
    supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const memberCount = Array.isArray(members) ? members.length : 0;
  const pendingInviteCount = count ?? 0;

  return {
    memberCount,
    pendingInviteCount,
    seatsUsed: memberCount + pendingInviteCount,
  };
}

export function buildEntitlementSummary(subscription: SubscriptionSnapshot, usage: BillingUsage) {
  const plan = getPlanDefinition(subscription.plan_key);
  const effectivePlan = getEffectivePlan(subscription.plan_key, subscription.status);

  return {
    plan,
    effectivePlan,
    usage,
    seatsRemaining: Math.max(effectivePlan.seatsIncluded - usage.seatsUsed, 0),
    canInviteMore: usage.seatsUsed < effectivePlan.seatsIncluded,
    historyWindowDays: effectivePlan.historyWindowDays,
  };
}

export function isWithinHistoryWindow(createdAt: string, historyWindowDays: number | null) {
  if (historyWindowDays === null) {
    return true;
  }

  const createdAtDate = new Date(createdAt);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - historyWindowDays);

  return createdAtDate >= cutoffDate;
}

export function filterByHistoryWindow<T extends { created_at: string }>(
  records: T[],
  historyWindowDays: number | null
) {
  return records.filter((record) => isWithinHistoryWindow(record.created_at, historyWindowDays));
}

export async function recordOrganizationActivity(
  supabase: any,
  input: {
    organizationId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
    actorUserId?: string | null;
  }
) {
  const { error } = await supabase.rpc("record_organization_activity", {
    p_organization_id: input.organizationId,
    p_action: input.action,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId ?? null,
    p_metadata: input.metadata ?? {},
    p_actor_user_id: input.actorUserId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateOrganizationCustomerId(organizationId: string, customerId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({ provider_customer_id: customerId })
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }
}
