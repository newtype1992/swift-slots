import Link from "next/link";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { activeOrganization, profile } = await requireWorkspaceShellContext();

  return (
    <div className="grid">
      <section className="panel">
        <div className="sectionHeader">
          <div className="stack compactStack">
            <p className="eyebrow">Settings</p>
            <h1>{profile?.role === "studio_operator" ? "Operator settings" : "Consumer settings"}</h1>
            <p className="muted">
              {profile?.role === "studio_operator"
                ? "Keep studio setup and operator identity on the main path. Legacy starter settings stay available, but no longer drive navigation."
                : "Keep account identity and saved location focused on the booking flow. Legacy starter settings stay available, but off the main path."}
            </p>
          </div>
        </div>
        <SettingsNav role={profile?.role ?? "consumer"} />
        {activeOrganization ? (
          <div className="card subtle topSpacing">
            <strong>Legacy starter controls</strong>
            <p className="helper">Organization and billing remain accessible here while the inherited starter layer is phased out.</p>
            <div className="actions topSpacing">
              <Link href="/settings/organization" className="buttonSecondary">
                Organization
              </Link>
              <Link href="/settings/billing" className="buttonSecondary">
                Billing
              </Link>
            </div>
          </div>
        ) : null}
      </section>
      {children}
    </div>
  );
}
