import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/swift/empty-state";
import { PageHeader } from "@/components/swift/page-header";
import { openBillingPortalAction, startCheckoutAction } from "@/app/dashboard/actions";
import { PLAN_CATALOG } from "@/lib/billing/plans";
import { getActiveWorkspaceDetails, requireWorkspaceShellContext } from "@/lib/workspace/server";

type BillingSettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BillingSettingsPage({ searchParams }: BillingSettingsPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, activeOrganization, activeRole } = await requireWorkspaceShellContext();
  const { billing, billingSummary, canManageBilling, canViewBilling } = await getActiveWorkspaceDetails({
    supabase,
    activeOrganizationId: activeOrganization?.id ?? null,
    activeRole,
  });

  if (!activeOrganization) {
    return (
      <EmptyState
        title="No active workspace"
        description="Select or create an organization before reviewing legacy starter billing."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Legacy billing"
        title={`${activeOrganization.name} billing settings`}
        description="This inherited starter billing surface is still reachable, but it has been removed from the main Swift Slots navigation."
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

      {canViewBilling && billing && billingSummary ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>
                  {billingSummary.plan.name} plan
                  {billingSummary.plan.key !== billingSummary.effectivePlan.key ? " (restricted access)" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{billingSummary.plan.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{billing.status}</Badge>
                  <Badge variant="outline">{billingSummary.usage.seatsUsed} seats used</Badge>
                  <Badge variant="outline">{billingSummary.effectivePlan.seatsIncluded} seats included</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {billing.current_period_end
                    ? `Current period ends ${formatDate(billing.current_period_end)}${billing.cancel_at_period_end ? " and cancellation is scheduled." : "."}`
                    : "No paid billing period is active yet."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>Entitlements</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Seats remaining</p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{billingSummary.seatsRemaining}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pending invites</p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{billingSummary.usage.pendingInviteCount}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">History window</p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{billingSummary.effectivePlan.inviteHistoryLabel}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {Object.values(PLAN_CATALOG).map((plan) => {
              const isCurrentPlan = billing.plan_key === plan.key;
              const isFreePlan = plan.key === "free";

              return (
                <Card key={plan.key} className="border-border/80 bg-card/95 shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {isCurrentPlan ? <Badge>Current plan</Badge> : <Badge variant="outline">Available</Badge>}
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">{plan.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Seats</span>
                        <span className="font-medium text-foreground">{plan.seatsIncluded}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Invite history</span>
                        <span className="font-medium text-foreground">{plan.inviteHistoryLabel}</span>
                      </div>
                    </div>
                    {isCurrentPlan ? (
                      <Badge variant="outline">Current plan</Badge>
                    ) : canManageBilling && !isFreePlan ? (
                      <form action={startCheckoutAction}>
                        <input type="hidden" name="organizationId" value={activeOrganization.id} />
                        <input type="hidden" name="planKey" value={plan.key} />
                        <input type="hidden" name="redirectTo" value="/settings/billing" />
                        <Button type="submit" className="w-full">
                          Upgrade to {plan.name}
                        </Button>
                      </form>
                    ) : (
                      <Badge variant="outline">{isFreePlan ? "Starter tier" : "Owner managed"}</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>{canManageBilling ? "Owner actions" : "Billing access"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {canManageBilling
                  ? "Only owners can launch checkout or open the billing portal for the active workspace."
                  : "You can review billing, but only organization owners can change plans or open the portal."}
              </p>
              {canManageBilling ? (
                <form action={openBillingPortalAction}>
                  <input type="hidden" name="organizationId" value={activeOrganization.id} />
                  <input type="hidden" name="redirectTo" value="/settings/billing" />
                  <Button type="submit" variant="outline">
                    Open billing portal
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          title="Billing access is restricted"
          description="Only organization admins and owners can view billing for this workspace."
        />
      )}
    </div>
  );
}
