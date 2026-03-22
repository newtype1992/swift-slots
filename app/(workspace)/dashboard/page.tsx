import Link from "next/link";
import { getMarketplaceSlots } from "@/lib/marketplace/server";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type DashboardOverviewPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

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
  const { supabase, user, profile, organizations } = await requireWorkspaceShellContext();
  const { studio, slots } =
    profile?.role === "studio_operator"
      ? await getOperatorStudioSnapshot({
          supabase,
          userId: user.id,
        })
      : { studio: null, slots: [] };
  const consumerMarketplaceSlots =
    profile?.role === "consumer"
      ? await getMarketplaceSlots({
          supabase,
          limit: 6,
        })
      : [];
  const upcomingOpenSlots = slots.filter((slot) => slot.status === "open");
  const hasLocationFallback = Boolean(profile?.latitude && profile?.longitude);

  return (
    <div className="grid">
      <section className="panel">
        <div className="sectionHeader">
          <div className="stack compactStack">
            <p className="eyebrow">Overview</p>
            <h1>{profile?.role === "studio_operator" ? "Studio operator overview" : "Consumer overview"}</h1>
            <p className="muted">
              {profile?.role === "studio_operator"
                ? "Track studio readiness, live slot inventory, and the next actions required to keep discounted openings moving."
                : "Review the account state, current marketplace supply, and the fastest path from discovery into booking."}
            </p>
          </div>
          <div className="sectionHeaderActions">
            <Link href="/settings/profile" className="buttonSecondary">
              Edit profile
            </Link>
            <Link href={profile?.role === "consumer" ? "/marketplace" : "/settings/studio"} className="button">
              {profile?.role === "studio_operator" ? "Manage studio" : "Open marketplace"}
            </Link>
          </div>
        </div>
        {params.error ? <p className="message">Error: {params.error}</p> : null}
        {params.message ? <p className="message">{params.message}</p> : null}
      </section>

      <section className="metricGrid">
        <article className="metricCard">
          <p className="eyebrow">Account role</p>
          <div className="metricValue">{profile?.role === "studio_operator" ? "Operator" : "Consumer"}</div>
          <p className="helper">
            {profile?.role === "studio_operator"
              ? "This account is configured for studio setup and slot publishing."
              : "This account is configured for discovery, checkout, and booking confirmation."}
          </p>
        </article>
        <article className="metricCard">
          <p className="eyebrow">{profile?.role === "studio_operator" ? "Open slots" : "Live supply"}</p>
          <div className="metricValue">{profile?.role === "studio_operator" ? upcomingOpenSlots.length : consumerMarketplaceSlots.length}</div>
          <p className="helper">
            {profile?.role === "studio_operator" ? "Current operator inventory visible in the product." : "Bookable slots currently visible to this consumer."}
          </p>
        </article>
        <article className="metricCard">
          <p className="eyebrow">{profile?.role === "studio_operator" ? "Studio readiness" : "Saved location"}</p>
          <div className="metricValue">
            {profile?.role === "studio_operator" ? (studio ? "Ready" : "Needs setup") : hasLocationFallback ? "Ready" : "Add one"}
          </div>
          <p className="helper">
            {profile?.role === "studio_operator"
              ? studio
                ? "Studio identity is connected and slot publishing is available."
                : "Create the studio profile before posting last-minute inventory."
              : hasLocationFallback
                ? "Saved coordinates are available when device geolocation is denied."
                : "Add a fallback address in profile settings for more reliable marketplace ranking."}
          </p>
        </article>
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
              <span className="tag">
                {profile?.role === "studio_operator"
                  ? studio
                    ? "Studio connected"
                    : "Studio setup needed"
                  : hasLocationFallback
                    ? "Location fallback ready"
                    : "Location fallback needed"}
              </span>
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
              <p className="muted">
                Consumer mode is active. Use the marketplace to browse and book available slots.
                {organizations.length > 0 ? " Legacy starter workspaces remain in the background but are no longer part of the main flow." : ""}
              </p>
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
                  <p className="helper">The booking flow is available now, with Stripe checkout connected for smoke testing.</p>
                </div>
                <div className="card subtle">
                  <span className="helper">Immediate action</span>
                  <strong>Browse live openings</strong>
                  <p className="helper">Use the marketplace to review bookable slots and reserve a spot.</p>
                </div>
              </>
            )}
          </div>
        </article>
      </section>

      {profile?.role === "studio_operator" ? (
        <section className="panel">
          <div className="sectionHeader">
            <div className="stack compactStack">
              <p className="eyebrow">Slots</p>
              <h2>{studio ? `${studio.name} recent slots` : "No studio slots yet"}</h2>
            </div>
            <div className="sectionHeaderActions">
              <Link href="/settings/studio" className="buttonSecondary">
                Open studio settings
              </Link>
            </div>
          </div>
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
      ) : null}

      {profile?.role === "consumer" ? (
        <section className="panel">
          <div className="sectionHeader">
            <div className="stack compactStack">
              <p className="eyebrow">Marketplace</p>
              <h2>Available right now</h2>
            </div>
            <div className="sectionHeaderActions">
              <Link href="/marketplace" className="buttonSecondary">
                Open full marketplace
              </Link>
            </div>
          </div>
          <div className="list">
            {consumerMarketplaceSlots.length > 0 ? (
              consumerMarketplaceSlots.map((slot) => (
                <article key={slot.id} className="card subtle">
                  <div className="splitRow">
                    <div className="stack compactStack">
                      <strong>{slot.class_type}</strong>
                      <span className="helper">
                        {slot.studio?.name ?? "Unknown studio"} - {formatDateTime(slot.start_time)}
                      </span>
                    </div>
                    <span className="tag">{slot.available_spots} spots</span>
                  </div>
                  <div className="meta topSpacing">
                    <span className="tag">{slot.discount_percent}% off</span>
                    <span className="tag">{formatMoney(discountedPrice(slot.original_price, slot.discount_percent))}</span>
                  </div>
                  <div className="actions topSpacing">
                    <Link href={`/marketplace/${slot.id}`} className="buttonSecondary">
                      View slot
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="card subtle">
                <p className="muted">There are no bookable slots in the marketplace right now.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
