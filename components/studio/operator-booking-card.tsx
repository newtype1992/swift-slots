import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotStatusBadge } from "@/components/studio/slot-status-badge";
import type { OperatorBookingRecord } from "@/lib/studios/server";
import { discountedPrice } from "@/lib/marketplace/server";

type OperatorBookingCardProps = {
  booking: OperatorBookingRecord;
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

export function OperatorBookingCard({ booking }: OperatorBookingCardProps) {
  if (!booking.slot) {
    return null;
  }

  const reservedAmount =
    booking.amount_paid ?? discountedPrice(booking.slot.original_price, booking.slot.discount_percent);

  return (
    <Card className="border-border/70 bg-card/95" size="sm">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Booking created {formatDateTime(booking.created_at)}
            </p>
            <CardTitle>{booking.slot.class_type}</CardTitle>
            <p className="text-sm text-muted-foreground">Class starts {formatDateTime(booking.slot.start_time)}</p>
          </div>
          <SlotStatusBadge status={booking.payment_status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/12 bg-primary/8 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">Reserved</p>
          <p className="mt-1 text-sm font-semibold text-primary">{formatMoney(reservedAmount)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Slot state</p>
          <div className="mt-1">
            <SlotStatusBadge status={booking.slot.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Booking ID</p>
          <p className="mt-1 break-all text-sm font-medium text-foreground">{booking.id}</p>
        </div>
      </CardContent>
    </Card>
  );
}
