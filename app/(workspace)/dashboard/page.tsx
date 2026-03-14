import Link from "next/link";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import {
  activityLabel,
  activitySummary,
  getActiveWorkspaceDetails,
  requireWorkspaceShellContext,
} from "@/lib/workspace/server";

type DashboardOverviewPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function discountedPrice(originalPrice: number, discountPercent: number) {
  return originalPrice * (1 - discountPercent / 100);
}

export default async function DashboardOverviewPage({ searchParams }: DashboardOverviewPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, user, profile, organizations, activeOrganization, activeRole } = await requireWorkspaceShellContext();
  const { members, pendingInvites, billingSummary, visibleActivityLogs } = await getActiveWorkspaceDetails({
    supabase,
    activeOrganizationId: activeOrganization?.id ?? null,
    activeRole,
  });
  const { studio, slots } =
    profile?.role === "studio_operator"
      ? await getOperatorStudioSnapshot({
          supabase,
          userId: user.id,
        })
      : { studio: null, slots: [] };
  const upcomingOpenSlots = slots.filter((slot) => slot.status === "open");

  return (
    <div className="grid">
      <section className="panel">
        <p className="eyebrow">Overview</p>
        <h1>{profile?.role === "studio_operator" ? "Studio operator overview" : "Consumer overview"}</h1>
        <p className="muted">
          {profile?.role === "studio_operator"
            ? "Use this screen to track studio setup and the open slots you are publishing into the Swift Slots marketplace."
            : "Consumer mode is active. The marketplace flow comes next, but your account and role setup are already in place."}
        </p>
        {params.error ? <p className="message">Error: {params.error}</p> : null}
        {params.message ? <p className="message">{params.message}</p> : null}
        <div className="actions">
          <Link href="/settings/profile" className="buttonSecondary">
            Edit profile
          </Link>
          <Link href="/settings/studio" className="button">
            {profile?.role === "studio_operator" ? "Manage studio" : "View studio tools"}
          </Link>
          {activeOrganization ? (
            <Link href="/settings/organization" className="buttonSecondary">
              Starter org settings
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid two">
        <article className="panel">
          <p className="eyebrow">Account</p>
          <h2>Current session</h2>
          <div className="card subtle">
            <strong>{profile?.full_name || "No profile name yet"}</strong>
            <p className="muted">{profile?.email ?? user.email ?? "Unknown email"}</p>
            <div className="meta">
              <span className="tag">{profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}</span>
              <span className="tag">{organizations.length} inherited workspaces</span>
            </div>
          </div>
          {profile?.role === "studio_operator" && studio ? (
            <div className="card subtle topSpacing">
              <strong>{studio.name}</strong>
              <p className="helper">{studio.location_text}</p>
              <div className="meta">
                <span className="tag">{studio.slug}</span>
                <span className="tag">{upcomingOpenSlots.length} open slots</span>
              </div>
            </div>
          ) : profile?.role === "studio_operator" ? (
            <div className="card subtle topSpacing">
              <p className="muted">No studio profile exists yet. Create one from Studio settings to unlock slot posting.</p>
            </div>
          ) : (
            <div className="card subtle topSpacing">
              <p className="muted">Consumer mode is ready. Marketplace browsing and booking are still to be implemented.</p>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Next step</p>
          <h2>{profile?.role === "studio_operator" ? "Studio workflow" : "Consumer workflow"}</h2>
          <div className="list compact">
            {profile?.role === "studio_operator" ? (
              <>
                <div className="card subtle">
                  <span className="helper">Studio profile</span>
                  <strong>{studio ? "Configured" : "Needs setup"}</strong>
                  <p className="helper">
                    {studio ? "Update identity, categories, and location from Studio settings." : "Create the studio profile first."}
                  </p>
                </div>
                <div className="card subtle">
                  <span className="helper">Slot publishing</span>
                  <strong>{studio ? "Ready" : "Blocked until studio exists"}</strong>
                  <p className="helper">Post discounted openings with original price plus discount percent.</p>
                </div>
              </>
            ) : (
              <>
                <div className="card subtle">
                  <span className="helper">Account role</span>
                  <strong>Consumer mode active</strong>
                  <p className="helper">This account is prepared for marketplace browsing once the consumer flow is built.</p>
                </div>
                <div className="card subtle">
                  <span className="helper">Immediate action</span>
                  <strong>Keep profile current</strong>
                  <p className="helper">Switch roles from Profile settings later if this account needs studio access.</p>
                </div>
              </>
            )}
          </div>
        </article>
      </section>

      {profile?.role === "studio_operator" ? (
        <>
          <section className="grid three">
            <article className="card subtle">
              <h3>Studio readiness</h3>
              <div className="list compact">
                <div className="splitRow">
                  <span className="muted">Studio profile</span>
                  <strong>{studio ? "Ready" : "Missing"}</strong>
                </div>
                <div className="splitRow">
                  <span className="muted">Categories</span>
                  <strong>{studio?.class_categories.length ?? 0}</strong>
                </div>
              </div>
            </article>

            <article className="card subtle">
              <h3>Open inventory</h3>
              <div className="list compact">
                <div className="splitRow">
                  <span className="muted">Visible open slots</span>
                  <strong>{upcomingOpenSlots.length}</strong>
                </div>
                <div className="splitRow">
                  <span className="muted">Total listed slots</span>
                  <strong>{slots.length}</strong>
                </div>
              </div>
            </article>

            <article className="card subtle">
              <h3>Inherited starter state</h3>
              <div className="list compact">
                <div className="splitRow">
                  <span className="muted">Workspace role</span>
                  <strong>{activeRole ?? "Not set"}</strong>
                </div>
                <div className="splitRow">
                  <span className="muted">Inherited orgs</span>
                  <strong>{organizations.length}</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="panel">
            <p className="eyebrow">Slots</p>
            <h2>{studio ? `${studio.name} recent slots` : "No studio slots yet"}</h2>
            <div className="list">
              {slots.length > 0 ? (
                slots.slice(0, 6).map((slot) => (
                  <article key={slot.id} className="card subtle">
                    <div className="splitRow">
                      <div className="stack compactStack">
                        <strong>{slot.class_type}</strong>
                        <span className="helper">{formatDateTime(slot.start_time)}</span>
                      </div>
                      <span className={`tag status-${slot.status}`}>{slot.status}</span>
                    </div>
                    <div className="meta topSpacing">
                      <span className="tag">{slot.available_spots} spots</span>
                      <span className="tag">{slot.discount_percent}% off</span>
                      <span className="tag">{formatMoney(discountedPrice(slot.original_price, slot.discount_percent))}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="card subtle">
                  <p className="muted">Post the first open slot from Studio settings to start populating this overview.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {activeOrganization ? (
        <section className="panel">
          <p className="eyebrow">Starter carryover</p>
          <h2>{activeOrganization.name} inherited workspace activity</h2>
          <div className="list">
            {visibleActivityLogs.length > 0 ? (
              visibleActivityLogs.slice(0, 4).map((activity) => (
                <article key={activity.id} className="card subtle">
                  <div className="splitRow">
                    <div className="stack compactStack">
                      <strong>{activityLabel(activity.action)}</strong>
                      <span className="helper">{activitySummary(activity)}</span>
                    </div>
                    <span className="helper">{formatDate(activity.created_at)}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="card subtle">
                <p className="muted">No starter workspace activity is visible right now.</p>
              </div>
            )}
          </div>
          <div className="meta topSpacing">
            <span className="tag">{members.length} members</span>
            <span className="tag">{pendingInvites.length} pending invites</span>
            <span className="tag">{billingSummary?.effectivePlan.name ?? "No plan snapshot"}</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
