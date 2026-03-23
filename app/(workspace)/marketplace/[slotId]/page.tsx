import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/swift/page-header";
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Slot detail"
          title="Consumer mode required"
          description="Switch this account to the consumer role to review and book marketplace slots."
          actions={
            <Button asChild>
              <Link href="/settings/profile">Update account role</Link>
            </Button>
          }
        />
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Slot detail"
        title={slot.class_type}
        description={`${slot.studio?.name ?? "Unknown studio"} | ${slot.studio?.location_text ?? "Montreal"}`}
        meta={
          <>
            <Badge variant="outline">{slot.available_spots} spots left</Badge>
            <Badge variant="outline">{slot.discount_percent}% off</Badge>
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/marketplace">Back to marketplace</Link>
          </Button>
        }
      />

      {query.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Error: {query.error}
        </div>
      ) : null}
      {query.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {query.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Class details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Starts</p>
              <p className="mt-2 font-medium text-foreground">{formatDateTime(slot.start_time)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Class length</p>
              <p className="mt-2 font-medium text-foreground">{slot.class_length_minutes} minutes</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
              <p className="mt-2 font-medium text-foreground">{slot.studio?.name ?? "Unknown studio"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{slot.studio?.location_text ?? "Montreal"}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(slot.studio?.class_categories?.length ? slot.studio.class_categories : ["No categories listed"]).map((category) => (
                  <Badge key={category} variant="outline">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Book this slot</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Pricing is derived from original price plus discount percent, then passed into Stripe checkout.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Original price</p>
              <p className="mt-2 font-medium text-foreground">{formatMoney(slot.original_price)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Discount</p>
              <p className="mt-2 font-medium text-foreground">{slot.discount_percent}% off</p>
            </div>
            <div className="rounded-2xl border border-primary/12 bg-primary/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">You pay now</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-primary">{formatMoney(priceNow)}</p>
              <p className="mt-1 text-sm text-primary/80">{slot.available_spots} spots still available.</p>
            </div>
            <form action={createBookingAction} className="grid gap-3">
              <input type="hidden" name="slotId" value={slot.id} />
              <input type="hidden" name="redirectTo" value={`/marketplace/${slot.id}`} />
              <Button type="submit" className="w-full">
                Reserve spot and pay
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
