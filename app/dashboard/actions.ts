"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildEntitlementSummary,
  getOrganizationBillingUsage,
  getOrganizationSubscription,
  recordOrganizationActivity,
  updateOrganizationCustomerId,
} from "@/lib/billing/server";
import { isPlanKey, type PlanKey } from "@/lib/billing/plans";
import { setActiveOrganizationIdCookie } from "@/lib/organizations/active";
import { sendInviteEmail } from "@/lib/email/invite";
import { createStripeServerClient, getStripeLookupKeyForPlan, stripeIsConfigured } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function appOrigin(headerOrigin: string | null) {
  return headerOrigin || process.env.APP_URL || "http://localhost:3000";
}

type InviteRecord = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
};

type OrganizationRecord = {
  id: string;
};

async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?error=You%20must%20sign%20in%20first.");
  }

  return { supabase, user };
}

async function requireOrganizationOwner(organizationId: string) {
  const { supabase, user } = await requireAuthenticatedUser();
  const { data: membership, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();

  if (error || !membership || membership.role !== "owner") {
    redirect("/dashboard?error=Only%20organization%20owners%20can%20manage%20billing.");
  }

  return { supabase, user };
}

export async function createOrganizationAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedUser();

  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(name);

  const { data, error } = await supabase
    .rpc("create_organization", {
      p_name: name,
      p_slug: slug || null,
    })
    .single<OrganizationRecord>();

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.id) {
    await setActiveOrganizationIdCookie(data.id);
  }

  redirect("/dashboard?message=Organization%20created.");
}

export async function setActiveOrganizationAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "").trim();
  const { supabase, user } = await requireAuthenticatedUser();

  const { data: membership, error } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle<{ organization_id: string }>();

  if (error || !membership) {
    redirect("/dashboard?error=That%20organization%20is%20not%20available%20to%20this%20account.");
  }

  await setActiveOrganizationIdCookie(organizationId);
  redirect("/dashboard?message=Active%20organization%20updated.");
}

export async function inviteMemberAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "member").trim();

  const { supabase, user } = await requireAuthenticatedUser();
  const [subscription, usage] = await Promise.all([
    getOrganizationSubscription(supabase, organizationId),
    getOrganizationBillingUsage(supabase, organizationId),
  ]);
  const entitlementSummary = buildEntitlementSummary(subscription, usage);

  if (!entitlementSummary.canInviteMore) {
    redirect(
      `/dashboard?error=${encodeURIComponent(
        `This workspace is at its ${entitlementSummary.effectivePlan.name} seat limit. Upgrade billing before inviting more members.`
      )}`
    );
  }

  const { data: invite, error } = await supabase
    .rpc("invite_organization_member", {
      p_organization_id: organizationId,
      p_email: email,
      p_role: role,
    })
    .single<InviteRecord>();

  if (error || !invite) {
    redirect(`/dashboard?error=${encodeURIComponent(error?.message || "Unable to create invite.")}`);
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single<{ name: string }>();

  const inviteUrl = `${appOrigin((await headers()).get("origin"))}/invites/${invite.token}`;
  const emailResult = await sendInviteEmail({
    inviteeEmail: invite.email,
    inviterEmail: user?.email || "Unknown inviter",
    inviteRole: invite.role,
    inviteUrl,
    organizationName: organization?.name || "your organization",
  });

  await supabase.rpc("record_invite_delivery", {
    p_invite_id: invite.id,
    p_delivery_status: emailResult.status,
    p_delivery_error: emailResult.status === "sent" ? null : emailResult.reason,
  });

  if (emailResult.status === "sent") {
    redirect("/dashboard?message=Invite%20created%20and%20email%20sent.");
  }

  redirect(`/dashboard?message=${encodeURIComponent(emailResult.reason)}`);
}

export async function resendInviteAction(formData: FormData) {
  const inviteId = String(formData.get("inviteId") || "").trim();
  const { supabase, user } = await requireAuthenticatedUser();
  const { data: invite, error } = await supabase
    .from("organization_invites")
    .select("id, organization_id, email, role, token, status")
    .eq("id", inviteId)
    .single<InviteRecord & { status: string }>();

  if (error || !invite) {
    redirect(`/dashboard?error=${encodeURIComponent(error?.message || "Unable to load invite.")}`);
  }

  if (invite.status !== "pending") {
    redirect("/dashboard?error=Only%20pending%20invites%20can%20be%20resent.");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", invite.organization_id)
    .single<{ name: string }>();

  const inviteUrl = `${appOrigin((await headers()).get("origin"))}/invites/${invite.token}`;
  const emailResult = await sendInviteEmail({
    inviteeEmail: invite.email,
    inviterEmail: user?.email || "Unknown inviter",
    inviteRole: invite.role,
    inviteUrl,
    organizationName: organization?.name || "your organization",
  });

  await supabase.rpc("record_invite_delivery", {
    p_invite_id: invite.id,
    p_delivery_status: emailResult.status,
    p_delivery_error: emailResult.status === "sent" ? null : emailResult.reason,
  });

  if (emailResult.status === "sent") {
    redirect("/dashboard?message=Invite%20email%20resent.");
  }

  redirect(`/dashboard?message=${encodeURIComponent(emailResult.reason)}`);
}

export async function revokeInviteAction(formData: FormData) {
  const inviteId = String(formData.get("inviteId") || "").trim();
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("revoke_organization_invite", {
    p_invite_id: inviteId,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Invite%20revoked.");
}

export async function updateMemberRoleAction(formData: FormData) {
  const membershipId = String(formData.get("membershipId") || "").trim();
  const role = String(formData.get("role") || "").trim();

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("update_organization_member_role", {
    p_membership_id: membershipId,
    p_role: role,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Member%20role%20updated.");
}

export async function removeMemberAction(formData: FormData) {
  const membershipId = String(formData.get("membershipId") || "").trim();

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("remove_organization_member", {
    p_membership_id: membershipId,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Member%20removed.");
}

export async function startCheckoutAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "").trim();
  const requestedPlan = String(formData.get("planKey") || "").trim();

  if (!isPlanKey(requestedPlan) || requestedPlan === "free") {
    redirect("/dashboard?error=Select%20a%20valid%20paid%20plan.");
  }

  if (!stripeIsConfigured()) {
    redirect("/dashboard?error=Stripe%20is%20not%20configured.%20Set%20STRIPE_SECRET_KEY%20to%20enable%20checkout.");
  }

  const planKey = requestedPlan as PlanKey;
  const { supabase, user } = await requireOrganizationOwner(organizationId);
  const [organizationResponse, subscription] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle<{ id: string; name: string }>(),
    getOrganizationSubscription(supabase, organizationId),
  ]);

  if (organizationResponse.error || !organizationResponse.data) {
    redirect("/dashboard?error=Unable%20to%20load%20the%20selected%20organization.");
  }

  const stripe = createStripeServerClient();
  let customerId = subscription.provider_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: organizationResponse.data.name,
      metadata: {
        organization_id: organizationId,
      },
    });

    customerId = customer.id;
    await updateOrganizationCustomerId(organizationId, customerId);
  }

  const lookupKey = getStripeLookupKeyForPlan(planKey);

  if (!lookupKey) {
    redirect("/dashboard?error=The%20selected%20plan%20does%20not%20have%20a%20checkout%20configuration.");
  }

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  if (!prices.data[0]) {
    redirect(
      `/dashboard?error=${encodeURIComponent(
        `No active Stripe price was found for lookup key "${lookupKey}". Create that price in Stripe before using checkout.`
      )}`
    );
  }

  const origin = (await headers()).get("origin") || process.env.APP_URL || "http://localhost:3000";
  await recordOrganizationActivity(supabase, {
    organizationId,
    action: "billing.checkout_started",
    entityType: "subscription",
    metadata: {
      requested_plan_key: planKey,
      current_plan_key: subscription.plan_key,
      stripe_lookup_key: lookupKey,
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${origin}/dashboard?message=${encodeURIComponent("Billing updated successfully.")}`,
    cancel_url: `${origin}/dashboard?message=${encodeURIComponent("Checkout canceled.")}`,
    line_items: [
      {
        price: prices.data[0].id,
        quantity: 1,
      },
    ],
    metadata: {
      organization_id: organizationId,
      plan_key: planKey,
    },
    subscription_data: {
      metadata: {
        organization_id: organizationId,
        plan_key: planKey,
      },
    },
    client_reference_id: organizationId,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    redirect("/dashboard?error=Stripe%20checkout%20did%20not%20return%20a%20redirect%20URL.");
  }

  redirect(session.url);
}

export async function openBillingPortalAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "").trim();

  if (!stripeIsConfigured()) {
    redirect("/dashboard?error=Stripe%20is%20not%20configured.%20Set%20STRIPE_SECRET_KEY%20to%20enable%20billing%20portal.");
  }

  const { supabase } = await requireOrganizationOwner(organizationId);
  const subscription = await getOrganizationSubscription(supabase, organizationId);

  if (!subscription.provider_customer_id) {
    redirect("/dashboard?error=No%20Stripe%20customer%20exists%20for%20this%20organization%20yet.");
  }

  const stripe = createStripeServerClient();
  const origin = (await headers()).get("origin") || process.env.APP_URL || "http://localhost:3000";
  await recordOrganizationActivity(supabase, {
    organizationId,
    action: "billing.portal_opened",
    entityType: "subscription",
    metadata: {
      customer_id: subscription.provider_customer_id,
    },
  });
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.provider_customer_id,
    return_url: `${origin}/dashboard`,
  });

  redirect(session.url);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth?message=Signed%20out.");
}
