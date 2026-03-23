import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorSlotCard } from "@/components/studio/operator-slot-card";
import { EmptyState } from "@/components/swift/empty-state";
import { PageHeader } from "@/components/swift/page-header";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type DashboardOverviewPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function DashboardOverviewPage({ searchParams }: DashboardOverviewPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, user, profile } = await requireWorkspaceShellContext();

  if (profile?.role === "consumer") {
    redirect("/marketplace");
  }

  const { studio, slots } = await getOperatorStudioSnapshot({
    supabase,
    userId: user.id,
  });
  const openSlots = slots.filter((slot) => slot.status === "open");
  const lockedSlots = slots.filter((slot) => slot.status === "locked");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Operator overview"
        description="This dashboard is now a summary surface. Profile editing lives in Studio settings, and inventory work lives in Slots."
        meta={
          <>
            <Badge variant="outline">{studio ? "Studio connected" : "Studio setup needed"}</Badge>
            <Badge variant="outline">{openSlots.length} open slots</Badge>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/settings/studio">Studio profile</Link>
            </Button>
            <Button asChild>
              <Link href="/slots">Open slots</Link>
            </Button>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Studio readiness
            </p>
            <CardTitle>{studio ? "Ready" : "Needs setup"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {studio
              ? `${studio.name} is connected and ready for inventory publishing.`
              : "Create the studio profile before posting discounted openings."}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Open inventory
            </p>
            <CardTitle>{openSlots.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Live openings currently bookable in the marketplace.
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Locked inventory
            </p>
            <CardTitle>{lockedSlots.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Slots that are no longer editable or visible for booking.
          </CardContent>
        </Card>
      </div>

      {studio ? (
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Recent slots</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Use this summary to check the next few openings, then jump into Slots for posting and monitoring.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {slots.length > 0 ? (
              slots.map((slot) => <OperatorSlotCard key={slot.id} slot={slot} />)
            ) : (
              <EmptyState
                title="No slots posted yet"
                description="Open the Slots route to publish your first discounted opening."
                action={
                  <Button asChild>
                    <Link href="/slots">Open slots</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="Create a studio profile to begin"
          description="The operator flow now starts with studio setup, then moves into first-class slot management."
          action={
            <Button asChild>
              <Link href="/settings/studio">Create studio profile</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
