import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketplaceBooking } from "@/lib/marketplace/server";
import { discountedPrice } from "@/lib/marketplace/server";
import { SlotStatusBadge } from "@/components/studio/slot-status-badge";

type BookingCardProps = {
  booking: MarketplaceBooking;
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

export function BookingCard({ booking }: BookingCardProps) {
  if (!booking.slot) {
    return null;
  }

  const reservedAmount =
    booking.amount_paid ?? discountedPrice(booking.slot.original_price, booking.slot.discount_percent);

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {booking.slot.studio?.name ?? "Unknown studio"}
            </p>
            <CardTitle className="text-lg">{booking.slot.class_type}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(booking.slot.start_time)} at {booking.slot.studio?.location_text ?? "Montreal"}
            </p>
          </div>
          <SlotStatusBadge status={booking.payment_status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/12 bg-primary/8 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Reserved</p>
          <p className="mt-1 font-semibold text-primary">{formatMoney(reservedAmount)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Discount</p>
          <p className="mt-1 font-medium text-foreground">{booking.slot.discount_percent}% off</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Booked</p>
          <p className="mt-1 font-medium text-foreground">{formatDateTime(booking.created_at)}</p>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Review the confirmation screen for booking status and class details.
        </p>
        <Button asChild variant="outline">
          <Link href={`/marketplace/bookings/${booking.id}`}>
            Open confirmation
            <ArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
