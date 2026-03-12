export type PlanKey = "free" | "pro" | "business";

export type BillingStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  description: string;
  stripeLookupKey: string | null;
  seatsIncluded: number;
  inviteHistoryLabel: string;
  historyWindowDays: number | null;
};

export type SubscriptionSnapshot = {
  plan_key: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
};

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    name: "Free",
    description: "Foundational workspace for validating new SaaS ideas.",
    stripeLookupKey: null,
    seatsIncluded: 3,
    inviteHistoryLabel: "30-day invite history",
    historyWindowDays: 30,
  },
  pro: {
    key: "pro",
    name: "Pro",
    description: "Paid plan for a small operating team.",
    stripeLookupKey: "micro-saas-starter-pro-monthly",
    seatsIncluded: 10,
    inviteHistoryLabel: "90-day invite history",
    historyWindowDays: 90,
  },
  business: {
    key: "business",
    name: "Business",
    description: "Higher capacity plan for growing organizations.",
    stripeLookupKey: "micro-saas-starter-business-monthly",
    seatsIncluded: 25,
    inviteHistoryLabel: "Unlimited invite history",
    historyWindowDays: null,
  },
};

const ACTIVE_STATUSES = new Set<BillingStatus>(["active", "trialing"]);

export function isPlanKey(value: string): value is PlanKey {
  return value in PLAN_CATALOG;
}

export function normalizePlanKey(value: string | null | undefined): PlanKey {
  if (value && isPlanKey(value)) {
    return value;
  }

  return "free";
}

export function normalizeBillingStatus(value: string | null | undefined): BillingStatus {
  const fallback: BillingStatus = "inactive";

  if (!value) {
    return fallback;
  }

  return (
    [
      "inactive",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "unpaid",
    ] as BillingStatus[]
  ).includes(value as BillingStatus)
    ? (value as BillingStatus)
    : fallback;
}

export function isSubscriptionEntitled(planKey: PlanKey, status: BillingStatus) {
  return planKey === "free" || ACTIVE_STATUSES.has(status);
}

export function getEffectivePlan(planKey: string, status: string) {
  const normalizedPlanKey = normalizePlanKey(planKey);
  const normalizedStatus = normalizeBillingStatus(status);

  if (!isSubscriptionEntitled(normalizedPlanKey, normalizedStatus)) {
    return PLAN_CATALOG.free;
  }

  return PLAN_CATALOG[normalizedPlanKey];
}

export function getPlanDefinition(planKey: string) {
  return PLAN_CATALOG[normalizePlanKey(planKey)];
}
