import { redirect } from "next/navigation";
import {
  createOrganizationAction,
  inviteMemberAction,
  openBillingPortalAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
  setActiveOrganizationAction,
  signOutAction,
  startCheckoutAction,
  updateMemberRoleAction,
} from "./actions";
import { buildEntitlementSummary, filterByHistoryWindow, getOrganizationSubscription } from "@/lib/billing/server";
import { PLAN_CATALOG } from "@/lib/billing/plans";
import { getActiveOrganizationContext } from "@/lib/organizations/active";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

type OrganizationMember = {
  membership_id: string;
  user_id: string;
  email: string | null;
  role: string;
  status: string;
  created_at: string;
};

type OrganizationInvite = {
  invite_id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  delivery_status: string;
  delivery_error: string | null;
  expires_at: string;
  accepted_at: string | null;
  last_sent_at: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type BillingSnapshot = {
  organization_id: string;
  plan_key: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
};

type ActivityLog = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function asPending(invite: OrganizationInvite) {
  return invite.status === "pending" && new Date(invite.expires_at) >= new Date();
}

function historyLabel(invite: OrganizationInvite) {
  if (invite.status === "pending" && new Date(invite.expires_at) < new Date()) {
    return "expired";
  }

  return invite.status;
}

function activityLabel(action: string) {
  return action
    .split(".")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function activitySummary(activity: ActivityLog) {
  const metadata = activity.metadata ?? {};

  if (typeof metadata.email === "string") {
    return metadata.email;
  }

  if (typeof metadata.requested_plan_key === "string") {
    return `Plan ${metadata.requested_plan_key}`;
  }

  if (typeof metadata.new_plan_key === "string") {
    return `Plan ${metadata.new_plan_key}`;
  }

  if (typeof metadata.new_status === "string") {
    return `Status ${metadata.new_status}`;
  }

  return activity.entity_type;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const [{ data: profile }, activeContext] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name").eq("id", user.id).maybeSingle<Profile>(),
    getActiveOrganizationContext(supabase, user.id),
  ]);

  const { activeOrganization, activeRole, organizations, membershipRoleByOrganization } = activeContext;
  const canViewBilling = activeRole === "owner" || activeRole === "admin";
  const canManageBilling = activeRole === "owner";

  let members: OrganizationMember[] = [];
  let invites: OrganizationInvite[] = [];
  let billing: BillingSnapshot | null = null;
  let activityLogs: ActivityLog[] = [];

  if (activeOrganization) {
    const [{ data: memberRows }, { data: inviteRows }, subscription, { data: activityRows }] = await Promise.all([
      supabase
        .rpc("get_organization_members", {
          p_organization_id: activeOrganization.id,
        })
        .returns<OrganizationMember[]>(),
      activeRole === "owner"
        ? supabase
            .rpc("get_organization_invite_history", {
              p_organization_id: activeOrganization.id,
            })
            .returns<OrganizationInvite[]>()
        : Promise.resolve({ data: [] as OrganizationInvite[], error: null }),
      canViewBilling ? getOrganizationSubscription(supabase, activeOrganization.id) : Promise.resolve(null),
      supabase
        .from("activity_logs")
        .select("id, action, entity_type, entity_id, metadata, created_at")
        .eq("organization_id", activeOrganization.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<ActivityLog[]>(),
    ]);

    members = Array.isArray(memberRows) ? memberRows : [];
    invites = Array.isArray(inviteRows) ? inviteRows : [];
    billing = subscription;
    activityLogs = Array.isArray(activityRows) ? activityRows : [];
  }

  const pendingInvites = invites.filter(asPending);
  const billingSummary = billing
    ? buildEntitlementSummary(billing, {
        memberCount: members.length,
        pendingInviteCount: pendingInvites.length,
        seatsUsed: members.length + pendingInvites.length,
      })
    : null;
  const inviteHistory = filterByHistoryWindow(
    invites.filter((invite) => !asPending(invite)),
    billingSummary?.historyWindowDays ?? 30
  );
  const visibleActivityLogs = filterByHistoryWindow(activityLogs, billingSummary?.historyWindowDays ?? 30);

  return (
    <main className="grid">
      <section className="grid two">
        <article className="panel">
          <p className="eyebrow">Account</p>
          <h1>Dashboard</h1>
          <p className="muted">
            This page is protected by Supabase SSR session handling and only returns rows allowed by RLS.
          </p>
          <div className="stack">
            <div className="card">
              <h3>Signed in as</h3>
              <p className="muted">{profile?.email ?? user.email ?? "Unknown email"}</p>
              <div className="meta">
                <span className="tag">{profile?.full_name || "No profile name yet"}</span>
                <span className="tag">{user.id}</span>
              </div>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="dangerButton">
                Sign out
              </button>
            </form>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Workspace</p>
          <h2>Active organization</h2>
          <p className="muted">
            The selected workspace is persisted in a secure cookie and revalidated against current memberships
            on every request.
          </p>
          {activeOrganization ? (
            <div className="stack">
              <div className="card activeCard">
                <h3>{activeOrganization.name}</h3>
                <div className="meta">
                  <span className="tag">{activeOrganization.slug}</span>
                  <span className="tag">{activeRole ?? "member"}</span>
                  <span className="tag">Selected</span>
                </div>
              </div>
              <div className="list compact">
                {organizations.map((organization) => {
                  const isActive = organization.id === activeOrganization.id;
                  const role = membershipRoleByOrganization.get(organization.id) ?? "member";

                  return (
                    <div key={organization.id} className={`card subtle ${isActive ? "activeCard" : ""}`}>
                      <div className="splitRow">
                        <div>
                          <strong>{organization.name}</strong>
                          <div className="meta">
                            <span className="tag">{organization.slug}</span>
                            <span className="tag">{role}</span>
                          </div>
                        </div>
                        {isActive ? (
                          <span className="tag">Active</span>
                        ) : (
                          <form action={setActiveOrganizationAction}>
                            <input type="hidden" name="organizationId" value={organization.id} />
                            <button type="submit" className="buttonSecondary">
                              Switch
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card">
              <h3>No organizations yet</h3>
              <p className="muted">Create your first organization to establish an active workspace.</p>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Create</p>
        <h2>Create an organization</h2>
        <p className="muted">
          This uses the `create_organization` RPC, which creates the org, owner membership, and initial
          activity log in one database transaction.
        </p>
        {params.error ? <p className="message">Error: {params.error}</p> : null}
        {params.message ? <p className="message">{params.message}</p> : null}
        <form action={createOrganizationAction} className="form">
          <div className="field">
            <label htmlFor="org-name">Organization name</label>
            <input id="org-name" name="name" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="org-slug">Organization slug</label>
            <input id="org-slug" name="slug" type="text" placeholder="optional-auto-generated" />
          </div>
          <button type="submit" className="button">
            Create organization
          </button>
        </form>
      </section>

      <section className="panel">
        <p className="eyebrow">Billing</p>
        <h2>{activeOrganization ? `${activeOrganization.name} billing` : "Workspace billing"}</h2>
        {activeOrganization ? (
          canViewBilling && billing && billingSummary ? (
            <div className="stack">
              <div className="grid two">
                <div className="card">
                  <h3>
                    {billingSummary.plan.name} plan
                    {billingSummary.plan.key !== billingSummary.effectivePlan.key ? " (restricted access)" : ""}
                  </h3>
                  <p className="muted">{billingSummary.plan.description}</p>
                  <div className="meta">
                    <span className="tag">{billing.status}</span>
                    <span className="tag">{billingSummary.usage.seatsUsed} seats used</span>
                    <span className="tag">{billingSummary.effectivePlan.seatsIncluded} seats included</span>
                  </div>
                  {billing.current_period_end ? (
                    <p className="helper">
                      Current period ends{" "}
                      {new Date(billing.current_period_end).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {billing.cancel_at_period_end ? " and cancellation is scheduled." : "."}
                    </p>
                  ) : (
                    <p className="helper">No paid billing period is active yet.</p>
                  )}
                </div>

                <div className="card">
                  <h3>Entitlements</h3>
                  <div className="list compact">
                    <div className="splitRow">
                      <span className="muted">Seats remaining</span>
                      <strong>{billingSummary.seatsRemaining}</strong>
                    </div>
                    <div className="splitRow">
                      <span className="muted">Pending invites</span>
                      <strong>{billingSummary.usage.pendingInviteCount}</strong>
                    </div>
                    <div className="splitRow">
                      <span className="muted">Invite history</span>
                      <strong>{billingSummary.effectivePlan.inviteHistoryLabel}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid three">
                {Object.values(PLAN_CATALOG).map((plan) => {
                  const isCurrentPlan = billing.plan_key === plan.key;
                  const isFreePlan = plan.key === "free";

                  return (
                    <article key={plan.key} className={`card subtle ${isCurrentPlan ? "activeCard" : ""}`}>
                      <div className="stack">
                        <div>
                          <h3>{plan.name}</h3>
                          <p className="muted">{plan.description}</p>
                        </div>
                        <div className="list compact">
                          <div className="splitRow">
                            <span className="muted">Seats</span>
                            <strong>{plan.seatsIncluded}</strong>
                          </div>
                          <div className="splitRow">
                            <span className="muted">Invite history</span>
                            <strong>{plan.inviteHistoryLabel}</strong>
                          </div>
                        </div>
                        {isCurrentPlan ? (
                          <span className="tag">Current plan</span>
                        ) : canManageBilling && !isFreePlan ? (
                          <form action={startCheckoutAction}>
                            <input type="hidden" name="organizationId" value={activeOrganization.id} />
                            <input type="hidden" name="planKey" value={plan.key} />
                            <button type="submit" className="button">
                              Upgrade to {plan.name}
                            </button>
                          </form>
                        ) : (
                          <span className="tag">{isFreePlan ? "Starter tier" : "Owner managed"}</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {canManageBilling ? (
                <div className="inline-actions">
                  <form action={openBillingPortalAction}>
                    <input type="hidden" name="organizationId" value={activeOrganization.id} />
                    <button type="submit" className="buttonSecondary">
                      Open billing portal
                    </button>
                  </form>
                </div>
              ) : (
                <p className="helper">Only organization owners can change billing or upgrade plans.</p>
              )}
            </div>
          ) : (
            <div className="card">
              <h3>Billing access is restricted</h3>
              <p className="muted">Only organization admins and owners can view billing for this workspace.</p>
            </div>
          )
        ) : (
          <div className="card">
            <h3>No active organization</h3>
            <p className="muted">Create or select a workspace before configuring billing.</p>
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Tenancy</p>
        <h2>{activeOrganization ? `${activeOrganization.name} workspace` : "Your organizations"}</h2>
        <div className="list">
          {activeOrganization ? (
            <article className="card">
              <div className="splitRow">
                <div>
                  <h3>{activeOrganization.name}</h3>
                  <div className="meta">
                    <span className="tag">{activeOrganization.slug}</span>
                    <span className="tag">{activeRole ?? "member"}</span>
                    <span className="tag">
                      {new Date(activeOrganization.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="card subtle compactInfo">
                  <strong>{members.length}</strong>
                  <span className="muted">members visible in current workspace</span>
                </div>
              </div>

              <div className="stack sectionTop">
                <div className="stack">
                  <h4>Members</h4>
                  <div className="list compact">
                    {members.map((member) => (
                      <div key={member.membership_id} className="card subtle">
                        <div className="splitRow">
                          <div>
                            <strong>{member.email ?? member.user_id}</strong>
                            <div className="meta">
                              <span className="tag">{member.role}</span>
                              <span className="tag">{member.status}</span>
                            </div>
                          </div>
                          {activeRole === "owner" && member.role !== "owner" ? (
                            <div className="inline-actions">
                              <form action={updateMemberRoleAction}>
                                <input type="hidden" name="membershipId" value={member.membership_id} />
                                <input
                                  type="hidden"
                                  name="role"
                                  value={member.role === "admin" ? "member" : "admin"}
                                />
                                <button type="submit" className="buttonSecondary">
                                  Make {member.role === "admin" ? "member" : "admin"}
                                </button>
                              </form>
                              <form action={removeMemberAction}>
                                <input type="hidden" name="membershipId" value={member.membership_id} />
                                <button type="submit" className="dangerButton">
                                  Remove
                                </button>
                              </form>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {members.length === 0 ? (
                      <div className="card subtle">
                        <p className="muted">No members are visible for this organization yet.</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {activeRole === "owner" ? (
                  <div className="grid two">
                    <div className="panel inset">
                      <h4>Invite member</h4>
                      <form action={inviteMemberAction} className="form">
                        <input type="hidden" name="organizationId" value={activeOrganization.id} />
                        <div className="field">
                          <label htmlFor={`invite-email-${activeOrganization.id}`}>Email</label>
                          <input id={`invite-email-${activeOrganization.id}`} name="email" type="email" required />
                        </div>
                        <div className="field">
                          <label htmlFor={`invite-role-${activeOrganization.id}`}>Role</label>
                          <select id={`invite-role-${activeOrganization.id}`} name="role" className="select">
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <button type="submit" className="button">
                          Send invite
                        </button>
                      </form>
                    </div>

                    <div className="panel inset">
                      <h4>Pending invites</h4>
                      <div className="list compact">
                        {pendingInvites.length > 0 ? (
                          pendingInvites.map((invite) => (
                            <div key={invite.invite_id} className="card subtle">
                              <div className="stack">
                                <div className="splitRow">
                                  <strong>{invite.email}</strong>
                                  <div className="meta">
                                    <span className="tag">{invite.role}</span>
                                    <span className={`tag status-${invite.delivery_status}`}>
                                      {invite.delivery_status}
                                    </span>
                                  </div>
                                </div>
                                <p className="helper mono">{`/invites/${invite.token}`}</p>
                                {invite.delivery_error ? (
                                  <p className="helper dangerText">{invite.delivery_error}</p>
                                ) : null}
                                <div className="splitRow">
                                  <div className="stack compactStack">
                                    <span className="helper">
                                      Expires{" "}
                                      {new Date(invite.expires_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                    <span className="helper">
                                      {invite.last_sent_at
                                        ? `Last sent ${new Date(invite.last_sent_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })}`
                                        : "No email sent yet"}
                                    </span>
                                  </div>
                                  <div className="inline-actions">
                                    <form action={resendInviteAction}>
                                      <input type="hidden" name="inviteId" value={invite.invite_id} />
                                      <button type="submit" className="buttonSecondary">
                                        Resend
                                      </button>
                                    </form>
                                    <form action={revokeInviteAction}>
                                      <input type="hidden" name="inviteId" value={invite.invite_id} />
                                      <button type="submit" className="dangerButton">
                                        Revoke
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="card subtle">
                            <p className="muted">No pending invites.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeRole === "owner" ? (
                  <div className="panel inset">
                    <h4>Invite history</h4>
                    <div className="list compact">
                      {inviteHistory.length > 0 ? (
                        inviteHistory.map((invite) => (
                          <div key={invite.invite_id} className="card subtle">
                            <div className="splitRow">
                              <div className="stack compactStack">
                                <strong>{invite.email}</strong>
                                <div className="meta">
                                  <span className="tag">{invite.role}</span>
                                  <span className={`tag status-${historyLabel(invite)}`}>
                                    {historyLabel(invite)}
                                  </span>
                                  <span className={`tag status-${invite.delivery_status}`}>
                                    {invite.delivery_status}
                                  </span>
                                </div>
                              </div>
                              <div className="stack compactStack alignEnd">
                                <span className="helper">
                                  Created{" "}
                                  {new Date(invite.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                {invite.accepted_at ? (
                                  <span className="helper">
                                    Accepted{" "}
                                    {new Date(invite.accepted_at).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="card subtle">
                          <p className="muted">
                            No invite history is available inside the current plan retention window.
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="helper">
                      Retention: {billingSummary?.effectivePlan.inviteHistoryLabel ?? "30-day invite history"}
                    </p>
                  </div>
                ) : null}
              </div>
            </article>
          ) : (
            <div className="card">
              <h3>No organizations yet</h3>
              <p className="muted">Create one above to establish your first active organization.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Activity</p>
        <h2>{activeOrganization ? `${activeOrganization.name} activity` : "Workspace activity"}</h2>
        {activeOrganization ? (
          <div className="list">
            {visibleActivityLogs.length > 0 ? (
              visibleActivityLogs.map((activity) => (
                <article key={activity.id} className="card subtle">
                  <div className="splitRow">
                    <div className="stack compactStack">
                      <strong>{activityLabel(activity.action)}</strong>
                      <span className="helper">{activitySummary(activity)}</span>
                    </div>
                    <span className="helper">
                      {new Date(activity.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="card">
                <h3>No recent activity</h3>
                <p className="muted">No activity is available inside the current plan retention window.</p>
              </div>
            )}
            <p className="helper">
              History window: {billingSummary?.effectivePlan.inviteHistoryLabel ?? "30-day history"}.
            </p>
          </div>
        ) : (
          <div className="card">
            <h3>No active organization</h3>
            <p className="muted">Create or select a workspace before reviewing activity history.</p>
          </div>
        )}
      </section>
    </main>
  );
}
