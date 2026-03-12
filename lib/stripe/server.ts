import Stripe from "stripe";
import { PLAN_CATALOG, type PlanKey } from "@/lib/billing/plans";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function stripeIsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function createStripeServerClient() {
  return new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
}

export function getStripeLookupKeyForPlan(planKey: PlanKey) {
  return PLAN_CATALOG[planKey].stripeLookupKey;
}
