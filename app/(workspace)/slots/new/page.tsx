import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotComposer } from "@/components/studio/slot-composer";
import { EmptyState } from "@/components/swift/empty-state";
import { InsetPanel } from "@/components/swift/inset-panel";
import { Notice } from "@/components/swift/notice";
import { PageHeader } from "@/components/swift/page-header";
import { getOperatorStudioSlots } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type NewSlotPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function NewSlotPage({ searchParams }: NewSlotPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, profile, user } = await requireWorkspaceShellContext();

  if (profile?.role !== "studio_operator") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="New slot"
          title="Operator mode required"
          description="Switch this account to studio operator mode before posting new discounted openings."
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

  if (!studio) {
    return (
      <EmptyState
        title="Create your studio profile first"
        description="Slot posting depends on a studio profile with identity, location, and categories already configured."
        action={
          <Button asChild>
            <Link href="/settings/studio">Open studio profile</Link>
          </Button>
        }
      />
    );
  }

  const openCount = slots.filter((slot) => slot.status === "open").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New slot"
        title="Post a discounted opening"
        description="This dedicated flow keeps slot creation focused on the details operators need most on a phone: class info, timing, price, discount, and available spots."
        meta={
          <>
            <Badge variant="outline">{studio.name}</Badge>
            <Badge variant="outline">{openCount} open now</Badge>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/slots">Back to slots</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/studio">Studio profile</Link>
            </Button>
          </>
        }
      />

      {params.error ? <Notice tone="error">Error: {params.error}</Notice> : null}
      {params.message ? <Notice tone="success">{params.message}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Slot details</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Publish a future class slot using original price and discount percent as the source of truth.
            </p>
          </CardHeader>
          <CardContent>
            <SlotComposer studioId={studio.id} redirectTo="/slots/new" successRedirectTo="/slots" />
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Posting checklist</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Keep the slot valid, bookable, and aligned with the Swift Slots marketplace rules.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{studio.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{studio.location_text}</p>
            </InsetPanel>

            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rules</p>
              <div className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Slots must start at least 15 minutes in the future.</p>
                <p>Use original price plus discount percent; live price is derived automatically.</p>
                <p>Slots lock before class start and cannot be edited after the first booking.</p>
              </div>
            </InsetPanel>

            <InsetPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current inventory</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{slots.length} total slots</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Review live, filled, locked, and expired states from the inventory monitor after publishing.
              </p>
            </InsetPanel>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
