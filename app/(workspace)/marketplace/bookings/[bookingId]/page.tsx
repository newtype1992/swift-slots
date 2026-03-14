import Link from "next/link";
import { notFound } from "next/navigation";
import { discountedPrice, getBookingConfirmation } from "@/lib/marketplace/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type BookingConfirmationPageProps = {
  params: Promise<{
    bookingId: string;
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

export default async function BookingConfirmationPage({ params, searchParams }: BookingConfirmationPageProps) {
  const { bookingId } = await params;
  const query = (await searchParams) ?? {};
  const { supabase, profile } = await requireWorkspaceShellContext();

  if (profile?.role !== "consumer") {
    notFound();
  }

  const booking = await getBookingConfirmation({
    supabase,
    bookingId,
  });

  if (!booking || !booking.slot) {
    notFound();
  }

  return (
    <div className="grid">
      <section className="panel">
        <p className="eyebrow">Booking confirmed</p>
        <h1>{booking.slot.class_type}</h1>
        <p className="muted">
          {booking.slot.studio?.name ?? "Unknown studio"} · {booking.slot.studio?.location_text ?? "Montreal"}
        </p>
        {query.error ? <p className="message">Error: {query.error}</p> : null}
        {query.message ? <p className="message">{query.message}</p> : null}
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Confirmation</h2>
          <div className="list">
            <div className="card subtle">
              <span className="helper">Booking ID</span>
              <p className="helper mono">{booking.id}</p>
            </div>
            <div className="card subtle">
              <span className="helper">Class start</span>
              <strong>{formatDateTime(booking.slot.start_time)}</strong>
            </div>
            <div className="card subtle">
              <span className="helper">Payment status</span>
              <strong>{booking.payment_status}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <h2>Pricing</h2>
          <div className="list">
            <div className="card subtle">
              <span className="helper">Original price</span>
              <strong>{formatMoney(booking.slot.original_price)}</strong>
            </div>
            <div className="card subtle">
              <span className="helper">Discount applied</span>
              <strong>{booking.slot.discount_percent}% off</strong>
            </div>
            <div className="card subtle activeCard">
              <span className="helper">Reserved amount</span>
              <strong>{formatMoney(discountedPrice(booking.slot.original_price, booking.slot.discount_percent))}</strong>
            </div>
          </div>
          <div className="actions topSpacing">
            <Link href="/marketplace" className="button">
              Back to marketplace
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
