import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperatorSlotCard } from "@/components/studio/operator-slot-card";
import { EmptyState } from "@/components/swift/empty-state";
import { Notice } from "@/components/swift/notice";
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
        description="Inventory monitoring stays here. Creating a new opening now happens in a dedicated posting flow built to work cleanly on smaller screens."
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
                <Link href="/slots/new">Post slot</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {params.error ? <Notice tone="error">Error: {params.error}</Notice> : null}
      {params.message ? <Notice tone="success">{params.message}</Notice> : null}

      {studio ? (
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Inventory monitor
            </p>
            <CardTitle>{studio.name}</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Keep live inventory separate from studio profile editing. Use the dedicated slot posting route when you need to publish a new discounted opening.
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
                          action={
                            <Button asChild variant="outline">
                              <Link href="/slots/new">Post slot</Link>
                            </Button>
                          }
                        />
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              <EmptyState
                title="No slots posted yet"
                description="Use the dedicated posting flow to publish your first discounted opening."
                action={
                  <Button asChild>
                    <Link href="/slots/new">Post your first slot</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
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
