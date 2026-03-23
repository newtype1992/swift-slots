import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { signOutAction } from "@/app/dashboard/actions";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";
import { WorkspaceNav } from "./workspace-nav";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { activeOrganization, activeRole, profile, supabase, user } = await requireWorkspaceShellContext();
  const { studio } =
    profile?.role === "studio_operator"
      ? await getOperatorStudioSnapshot({
          supabase,
          userId: user.id,
        })
      : { studio: null };

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-6">
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                Swift Slots
              </p>
              <Badge variant="outline" className="capitalize">
                {profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">
                {profile?.role === "studio_operator" ? "Operator control center" : "Consumer booking desk"}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {profile?.role === "studio_operator"
                  ? "Manage studio identity, post live inventory, and keep last-minute openings visible."
                  : "Move from discovery to payment quickly without wading through legacy workspace controls."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Current account
              </p>
              <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(242,246,255,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-sm font-semibold text-foreground">{profile?.full_name || "No profile name yet"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{profile?.email ?? "Unknown email"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}
                  </Badge>
                  <Badge variant="outline">{studio ? "Studio connected" : "No studio linked"}</Badge>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Role focus
              </p>
              {profile?.role === "studio_operator" ? (
                studio ? (
                  <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(242,246,255,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-sm font-semibold text-foreground">{studio.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{studio.location_text}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{studio.city}</span>
                      <span>|</span>
                      <span>{studio.class_categories.length} categories</span>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                    Create the studio profile from Studio settings to start publishing slots.
                  </p>
                )
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                  Consumer mode is active. Marketplace browsing, checkout, and confirmations live in this workspace.
                </p>
              )}
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Workspace navigation
              </p>
              <WorkspaceNav role={profile?.role ?? "consumer"} />
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Legacy tools
              </p>
              {activeOrganization ? (
                <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(242,246,255,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-sm font-semibold text-foreground">{activeOrganization.name}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Organization and billing controls are still available, but they are no longer part of the main Swift Slots path.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{activeRole ?? "member"}</span>
                    <span>|</span>
                    <span>{activeOrganization.slug}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href="/settings/organization">Org settings</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/settings/billing">Billing</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                  No legacy organization controls are active for this account.
                </p>
              )}
            </section>
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-card">
            <form action={signOutAction} className="w-full">
              <Button type="submit" variant="destructive" className="w-full">
                Sign out
              </Button>
            </form>
          </CardFooter>
        </Card>
      </aside>

      <section className="space-y-6">{children}</section>
    </main>
  );
}
