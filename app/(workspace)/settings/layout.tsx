import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/swift/page-header";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { activeOrganization, profile } = await requireWorkspaceShellContext();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title={profile?.role === "studio_operator" ? "Operator settings" : "Consumer settings"}
        description={
          profile?.role === "studio_operator"
            ? "Keep studio setup and operator identity on the main path. Legacy starter settings stay available, but no longer drive navigation."
            : "Keep account identity and saved location focused on the booking flow. Legacy starter settings stay available, but off the main path."
        }
      />

      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <SettingsNav role={profile?.role ?? "consumer"} />
          {activeOrganization ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Inherited starter controls</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Organization, billing, and invite administration now live behind a single low-priority entry point.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/settings/legacy">Open legacy settings</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
