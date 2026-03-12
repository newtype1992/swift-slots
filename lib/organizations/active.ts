import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const ACTIVE_ORGANIZATION_COOKIE = "active_organization_id";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
};

export type MembershipSummary = {
  organization_id: string;
  role: string;
};

export type ActiveOrganizationContext = {
  activeOrganization: OrganizationSummary | null;
  activeRole: string | null;
  organizations: OrganizationSummary[];
  membershipRoleByOrganization: Map<string, string>;
};

export async function getActiveOrganizationIdCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
}

export async function setActiveOrganizationIdCookie(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveOrganizationIdCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORGANIZATION_COOKIE);
}

export async function getActiveOrganizationContext(
  supabase: SupabaseClient,
  userId: string
): Promise<ActiveOrganizationContext> {
  const preferredOrganizationId = await getActiveOrganizationIdCookie();
  const [{ data: organizations }, { data: memberships }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, owner_user_id, created_at")
      .order("created_at", { ascending: true })
      .returns<OrganizationSummary[]>(),
    supabase
      .from("memberships")
      .select("organization_id, role")
      .eq("user_id", userId)
      .returns<MembershipSummary[]>(),
  ]);

  const safeOrganizations = organizations ?? [];
  const membershipRoleByOrganization = new Map(
    (memberships ?? []).map((membership) => [membership.organization_id, membership.role])
  );
  const activeOrganization =
    safeOrganizations.find((organization) => organization.id === preferredOrganizationId) ??
    safeOrganizations[0] ??
    null;

  return {
    activeOrganization,
    activeRole: activeOrganization ? membershipRoleByOrganization.get(activeOrganization.id) ?? null : null,
    organizations: safeOrganizations,
    membershipRoleByOrganization,
  };
}
