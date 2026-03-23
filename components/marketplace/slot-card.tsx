import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketplaceSlot } from "@/lib/marketplace/server";
import { discountedPrice } from "@/lib/marketplace/server";

type SlotCardProps = {
  slot: MarketplaceSlot;
  distanceLabel: string;
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

export function SlotCard({ slot, distanceLabel }: SlotCardProps) {
  const priceNow = discountedPrice(slot.original_price, slot.discount_percent);

  return (
    <Card className="h-full border-border/70 bg-card/95">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{formatDateTime(slot.start_time)}</Badge>
          <Badge variant="outline">{distanceLabel}</Badge>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {slot.studio?.name ?? "Unknown studio"}
            </p>
            <CardTitle className="text-lg">{slot.class_type}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {slot.studio?.location_text ?? "Montreal"}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/12 bg-primary/10 px-3.5 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Live price</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-primary">{formatMoney(priceNow)}</p>
            <p className="text-xs text-muted-foreground line-through">
              {formatMoney(slot.original_price)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Length</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{slot.class_length_minutes} min</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/65 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Availability</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{slot.available_spots} spots left</p>
        </div>
        <div className="rounded-2xl border border-primary/12 bg-primary/8 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">Discount</p>
          <p className="mt-1 text-sm font-semibold text-primary">{slot.discount_percent}% off</p>
        </div>
      </CardContent>
      <CardFooter className="items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Fast path to checkout. Inventory auto-locks 15 minutes before start.
        </p>
        <Button asChild size="sm">
          <Link href={`/marketplace/${slot.id}`}>
            Book slot
            <ArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
