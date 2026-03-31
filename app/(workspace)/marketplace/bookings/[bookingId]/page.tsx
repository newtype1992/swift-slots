import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsetPanel } from "@/components/swift/inset-panel";
import { Notice } from "@/components/swift/notice";
import { PageHeader } from "@/components/swift/page-header";
import { SlotStatusBadge } from "@/components/studio/slot-status-badge";
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

  const reservedAmount =
    booking.amount_paid ?? discountedPrice(booking.slot.original_price, booking.slot.discount_percent);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Booking confirmation"
        title={booking.slot.class_type}
        description={`${booking.slot.studio?.name ?? "Unknown studio"} | ${booking.slot.studio?.location_text ?? "Montreal"}`}
        meta={<SlotStatusBadge status={booking.payment_status} />}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/bookings">View all bookings</Link>
            </Button>
            <Button asChild>
              <Link href="/marketplace">Back to marketplace</Link>
            </Button>
          </>
        }
      />

      {query.error ? <Notice tone="error">Error: {query.error}</Notice> : null}
      {query.message ? <Notice tone="success">{query.message}</Notice> : null}
      {booking.payment_status !== "paid" ? (
        <Notice tone="warning">Payment is still processing. Refresh shortly if the status does not update.</Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Booking ID</p>
              <p className="mt-2 text-sm font-medium text-foreground break-all">{booking.id}</p>
            </InsetPanel>
            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payment status</p>
              <div className="mt-2">
                <SlotStatusBadge status={booking.payment_status} />
              </div>
            </InsetPanel>
            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Class start</p>
              <p className="mt-2 font-medium text-foreground">{formatDateTime(booking.slot.start_time)}</p>
            </InsetPanel>
            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Location</p>
              <p className="mt-2 font-medium text-foreground">{booking.slot.studio?.location_text ?? "Montreal"}</p>
            </InsetPanel>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Original price</p>
              <p className="mt-2 font-medium text-foreground">{formatMoney(booking.slot.original_price)}</p>
            </InsetPanel>
            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Discount applied</p>
              <p className="mt-2 font-medium text-foreground">{booking.slot.discount_percent}% off</p>
            </InsetPanel>
            <div className="rounded-2xl border border-primary/12 bg-primary/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Reserved amount</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-primary">{formatMoney(reservedAmount)}</p>
              {booking.amount_paid ? (
                <p className="mt-1 text-sm text-primary/80">Captured payment</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
