import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/swift/empty-state";
import { InsetPanel } from "@/components/swift/inset-panel";
import { PageHeader } from "@/components/swift/page-header";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

export default async function LegacySettingsPage() {
  const { activeOrganization, activeRole, profile } = await requireWorkspaceShellContext();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Legacy tools"
        title="Inherited starter controls"
        description={
          profile?.role === "studio_operator"
            ? "Organization, billing, and invite administration remain available here for inherited workspace access, but they are intentionally outside the main studio workflow."
            : "Organization, billing, and invite administration remain available here for inherited workspace access, but they are intentionally outside the main consumer booking workflow."
        }
        meta={
          activeOrganization ? (
            <>
              <Badge variant="outline">{activeOrganization.slug}</Badge>
              <Badge variant="outline">{activeRole ?? "member"}</Badge>
            </>
          ) : null
        }
      />

      {activeOrganization ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>{activeOrganization.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Use these surfaces only when you need inherited starter workspace administration. Product work for Swift Slots should stay in marketplace, bookings, dashboard, slots, studio, and profile.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <InsetPanel>
                  <p className="text-sm font-semibold text-foreground">Organization</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Members, roles, invites, and workspace identity.
                  </p>
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/settings/organization">
                      Open organization
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </InsetPanel>
                <InsetPanel>
                  <p className="text-sm font-semibold text-foreground">Billing</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Plan access, portal handoff, and inherited starter entitlements.
                  </p>
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/settings/billing">
                      Open billing
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </InsetPanel>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>Why this is separate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                The mobile refactor moves inherited starter workspace tools out of the primary Swift Slots navigation so operators and consumers land directly in product tasks.
              </p>
              <p>
                This page keeps that access available without mixing organization administration into booking and studio workflows.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="No active legacy workspace"
          description="This account does not currently have an active inherited organization context. Swift Slots product settings remain available through profile and studio."
        />
      )}
    </div>
  );
}
