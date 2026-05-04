import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorBookingCard } from "@/components/studio/operator-booking-card";
import { OperatorSlotCard } from "@/components/studio/operator-slot-card";
import { EmptyState } from "@/components/swift/empty-state";
import { Notice } from "@/components/swift/notice";
import { PageHeader } from "@/components/swift/page-header";
import { getOperatorDashboardSnapshot } from "@/lib/studios/server";
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

  const { studio, slots, bookings } = await getOperatorDashboardSnapshot({
    supabase,
    userId: user.id,
  });
  const openSlots = slots.filter((slot) => slot.status === "open");
  const lockedSlots = slots.filter((slot) => slot.status === "locked");
  const paidBookings = bookings.filter((booking) => booking.payment_status === "paid");

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
            <Badge variant="outline">{paidBookings.length} paid recently</Badge>
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
            ) : (
              <Button asChild>
                <Link href="/settings/studio">Create studio profile</Link>
              </Button>
            )}
          </>
        }
      />

      {params.error ? <Notice tone="error">Error: {params.error}</Notice> : null}
      {params.message ? <Notice tone="success">{params.message}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Recent booking activity
            </p>
            <CardTitle>{bookings.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Latest consumer reservations visible to this studio account, including payment status and captured amounts.
          </CardContent>
        </Card>
      </div>

      {studio ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
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
                  description="Open the dedicated posting flow to publish your first discounted opening."
                  action={
                    <Button asChild>
                      <Link href="/slots/new">Post slot</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>Recent booking activity</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Keep an eye on the latest reservations and payment outcomes without leaving the operator overview.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookings.length > 0 ? (
                bookings.map((booking) => <OperatorBookingCard key={booking.id} booking={booking} />)
              ) : (
                <EmptyState
                  title="No booking activity yet"
                  description="Once consumers reserve this studio's openings, the latest payment and slot activity will appear here."
                />
              )}
            </CardContent>
          </Card>
        </div>
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
