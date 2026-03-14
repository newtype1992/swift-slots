import Link from "next/link";
import { discountedPrice, getMarketplaceSlots } from "@/lib/marketplace/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type MarketplacePageProps = {
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

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, profile } = await requireWorkspaceShellContext();

  if (profile?.role !== "consumer") {
    return (
      <div className="grid">
        <section className="panel">
          <p className="eyebrow">Marketplace</p>
          <h1>Consumer mode required</h1>
          <p className="muted">Switch this account to the consumer role to browse and book marketplace slots.</p>
          {params.error ? <p className="message">Error: {params.error}</p> : null}
          {params.message ? <p className="message">{params.message}</p> : null}
          <div className="actions">
            <Link href="/settings/profile" className="button">
              Update account role
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const slots = await getMarketplaceSlots({
    supabase,
  });

  return (
    <div className="grid">
      <section className="panel">
        <p className="eyebrow">Marketplace</p>
        <h1>Book a last-minute class</h1>
        <p className="muted">
          Available slots are already filtered by the booking rules in Supabase, including the 15-minute lock window.
        </p>
        {params.error ? <p className="message">Error: {params.error}</p> : null}
        {params.message ? <p className="message">{params.message}</p> : null}
      </section>

      <section className="grid">
        {slots.length > 0 ? (
          slots.map((slot) => (
            <article key={slot.id} className="panel">
              <div className="splitRow">
                <div className="stack compactStack">
                  <p className="eyebrow">Open slot</p>
                  <h2>{slot.class_type}</h2>
                  <p className="muted">
                    {slot.studio?.name ?? "Unknown studio"} · {slot.studio?.location_text ?? "Montreal"}
                  </p>
                </div>
                <span className="tag">{slot.available_spots} spots left</span>
              </div>
              <div className="meta topSpacing">
                <span className="tag">{formatDateTime(slot.start_time)}</span>
                <span className="tag">{slot.class_length_minutes} min</span>
                <span className="tag">{slot.discount_percent}% off</span>
                <span className="tag">{formatMoney(discountedPrice(slot.original_price, slot.discount_percent))}</span>
              </div>
              <div className="actions topSpacing">
                <Link href={`/marketplace/${slot.id}`} className="button">
                  View slot
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="panel">
            <h2>No bookable slots right now</h2>
            <p className="muted">
              The marketplace is empty at the moment. Open slots will appear here once studios publish them far enough ahead of class start.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
