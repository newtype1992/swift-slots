import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperatorSlotCard } from "@/components/studio/operator-slot-card";
import { SlotComposer } from "@/components/studio/slot-composer";
import { EmptyState } from "@/components/swift/empty-state";
import { PageHeader } from "@/components/swift/page-header";
import { getOperatorStudioSlots } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type SlotsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

const slotViews = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "locked", label: "Locked" },
  { value: "expired", label: "Expired" },
] as const;

export default async function SlotsPage({ searchParams }: SlotsPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, profile, user } = await requireWorkspaceShellContext();

  if (profile?.role !== "studio_operator") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Slots"
          title="Operator mode required"
          description="Switch this account to studio operator mode before posting or monitoring live inventory."
          actions={
            <Button asChild>
              <Link href="/settings/profile">Update account role</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { studio, slots } = await getOperatorStudioSlots({
    supabase,
    userId: user.id,
  });
  const openCount = slots.filter((slot) => slot.status === "open").length;
  const filledCount = slots.filter((slot) => slot.status === "filled").length;
  const lockedCount = slots.filter((slot) => slot.status === "locked").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Slots"
        title="Live inventory management"
        description="Slot publishing now lives in its own operator route. Use it to post new openings and watch inventory move through open, filled, locked, and expired states."
        meta={
          <>
            <Badge variant="outline">{openCount} open</Badge>
            <Badge variant="outline">{filledCount} filled</Badge>
            <Badge variant="outline">{lockedCount} locked</Badge>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/settings/studio">Studio profile</Link>
            </Button>
            {studio ? (
              <Button asChild>
                <Link href="#slot-composer">Post slot</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {params.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Error: {params.error}
        </div>
      ) : null}
      {params.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.message}
        </div>
      ) : null}

      {studio ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <Card id="slot-composer" className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Slot composer
              </p>
              <CardTitle>Post a discounted opening</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Publish a future class slot with original price, discount percent, and available spots.
              </p>
            </CardHeader>
            <CardContent>
              <SlotComposer studioId={studio.id} redirectTo="/slots" />
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Inventory monitor
              </p>
              <CardTitle>{studio.name}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Keep live inventory separate from studio profile editing. Tabs below are built with the shared Radix-backed tab primitive.
              </p>
            </CardHeader>
            <CardContent>
              {slots.length > 0 ? (
                <Tabs defaultValue="all" className="gap-4">
                  <TabsList variant="line" className="w-full justify-start overflow-x-auto">
                    {slotViews.map((view) => (
                      <TabsTrigger key={view.value} value={view.value}>
                        {view.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {slotViews.map((view) => {
                    const visibleSlots =
                      view.value === "all" ? slots : slots.filter((slot) => slot.status === view.value);

                    return (
                      <TabsContent key={view.value} value={view.value} className="space-y-4">
                        {visibleSlots.length > 0 ? (
                          visibleSlots.map((slot) => <OperatorSlotCard key={slot.id} slot={slot} />)
                        ) : (
                          <EmptyState
                            title={`No ${view.label.toLowerCase()} slots`}
                            description="Publish a new opening or wait for live inventory to transition into this state."
                          />
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <EmptyState
                  title="No slots posted yet"
                  description="Use the slot composer to publish your first discounted opening."
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="Create your studio profile first"
          description="Slot management is a first-class route now, but it still depends on a studio profile with location and categories."
          action={
            <Button asChild>
              <Link href="/settings/studio">Open studio profile</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
