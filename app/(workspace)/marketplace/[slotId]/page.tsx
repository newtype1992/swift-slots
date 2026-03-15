import Link from "next/link";
import { notFound } from "next/navigation";
import { createBookingAction } from "../actions";
import { discountedPrice, getMarketplaceSlot } from "@/lib/marketplace/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type MarketplaceSlotDetailPageProps = {
  params: Promise<{
    slotId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    weekday: "short",
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

export default async function MarketplaceSlotDetailPage({
  params,
  searchParams,
}: MarketplaceSlotDetailPageProps) {
  const { slotId } = await params;
  const query = (await searchParams) ?? {};
  const { supabase, profile } = await requireWorkspaceShellContext();

  if (profile?.role !== "consumer") {
    return (
      <div className="grid">
        <section className="panel">
          <p className="eyebrow">Marketplace</p>
          <h1>Consumer mode required</h1>
          <p className="muted">Switch this account to the consumer role to review and book marketplace slots.</p>
          <div className="actions">
            <Link href="/settings/profile" className="button">
              Update account role
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const slot = await getMarketplaceSlot({
    supabase,
    slotId,
  });

  if (!slot) {
    notFound();
  }

  const priceNow = discountedPrice(slot.original_price, slot.discount_percent);

  return (
    <div className="grid">
      <section className="panel">
        <p className="eyebrow">Marketplace</p>
        <h1>{slot.class_type}</h1>
        <p className="muted">
          {slot.studio?.name ?? "Unknown studio"} · {slot.studio?.location_text ?? "Montreal"}
        </p>
        {query.error ? <p className="message">Error: {query.error}</p> : null}
        {query.message ? <p className="message">{query.message}</p> : null}
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Class details</h2>
          <div className="list">
            <div className="card subtle">
              <span className="helper">Starts</span>
              <strong>{formatDateTime(slot.start_time)}</strong>
            </div>
            <div className="card subtle">
              <span className="helper">Class length</span>
              <strong>{slot.class_length_minutes} minutes</strong>
            </div>
            <div className="card subtle">
              <span className="helper">Studio</span>
              <strong>{slot.studio?.name ?? "Unknown studio"}</strong>
              <p className="helper">{slot.studio?.location_text ?? "Montreal"}</p>
            </div>
            <div className="card subtle">
              <span className="helper">Categories</span>
              <div className="meta topSpacing">
                {(slot.studio?.class_categories?.length ? slot.studio.class_categories : ["No categories listed"]).map((category) => (
                  <span key={category} className="tag">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <h2>Book this slot</h2>
          <div className="list">
            <div className="card subtle">
              <span className="helper">Original price</span>
              <strong>{formatMoney(slot.original_price)}</strong>
            </div>
            <div className="card subtle">
              <span className="helper">Discount</span>
              <strong>{slot.discount_percent}% off</strong>
            </div>
            <div className="card subtle activeCard">
              <span className="helper">You pay now</span>
              <strong>{formatMoney(priceNow)}</strong>
              <p className="helper">{slot.available_spots} spots still available.</p>
            </div>
          </div>
          <form action={createBookingAction} className="form topSpacing">
            <input type="hidden" name="slotId" value={slot.id} />
            <input type="hidden" name="redirectTo" value={`/marketplace/${slot.id}`} />
            <button type="submit" className="button">
              Reserve spot and pay
            </button>
          </form>
          <div className="actions topSpacing">
            <Link href="/marketplace" className="buttonSecondary">
              Back to marketplace
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
