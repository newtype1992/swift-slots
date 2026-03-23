import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudioSlotRecord } from "@/lib/studios/server";
import { discountedPrice } from "@/lib/marketplace/server";
import { SlotStatusBadge } from "./slot-status-badge";

type OperatorSlotCardProps = {
  slot: StudioSlotRecord;
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

export function OperatorSlotCard({ slot }: OperatorSlotCardProps) {
  const discountedAmount = discountedPrice(slot.original_price, slot.discount_percent);

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {formatDateTime(slot.start_time)}
            </p>
            <CardTitle className="text-lg">{slot.class_type}</CardTitle>
          </div>
          <SlotStatusBadge status={slot.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Spots</p>
            <p className="mt-1 text-sm font-medium text-foreground">{slot.available_spots}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Length</p>
            <p className="mt-1 text-sm font-medium text-foreground">{slot.class_length_minutes} min</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Original</p>
            <p className="mt-1 text-sm font-medium text-foreground">{formatMoney(slot.original_price)}</p>
          </div>
          <div className="rounded-2xl border border-primary/12 bg-primary/8 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">Live price</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {formatMoney(discountedAmount)} ({slot.discount_percent}% off)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
