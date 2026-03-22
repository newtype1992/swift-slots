import Link from "next/link";
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
    <main className="workspaceLayout">
      <aside className="workspaceSidebar panel">
        <div className="stack">
          <div className="workspaceSidebarSection">
            <div className="brandBlock">
              <p className="eyebrow">Swift Slots</p>
              <span className="brandMeta">{profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}</span>
            </div>
            <h1 className="workspaceHeading">
              {profile?.role === "studio_operator" ? "Operator control center" : "Consumer booking desk"}
            </h1>
            <p className="muted">
              {profile?.role === "studio_operator"
                ? "Manage studio identity, publish discounted openings, and keep last-minute inventory moving."
                : "Move quickly from account state into discovery and booking without wading through starter-era admin tools."}
            </p>
          </div>

          <div className="workspaceSidebarSection">
            <h3 className="sectionLabel">Current account</h3>
            <div className="card subtle">
              <strong>{profile?.full_name || "No profile name yet"}</strong>
              <p className="muted">{profile?.email ?? "Unknown email"}</p>
              <div className="meta topSpacing">
                <span className="tag">{profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}</span>
                <span className="tag">{studio ? "Studio connected" : "No studio linked"}</span>
              </div>
            </div>
          </div>

          <div className="workspaceSidebarSection">
            <h3 className="sectionLabel">Role focus</h3>
            {profile?.role === "studio_operator" ? (
              studio ? (
                <div className="card subtle">
                  <strong>{studio.name}</strong>
                  <p className="helper">{studio.location_text}</p>
                  <div className="meta topSpacing">
                    <span className="tag">{studio.city}</span>
                    <span className="tag">{studio.class_categories.length} categories</span>
                  </div>
                </div>
              ) : (
                <div className="card subtle">
                  <p className="muted">Create the studio profile from Studio settings to start publishing slots.</p>
                </div>
              )
            ) : (
              <div className="card subtle">
                <p className="muted">Consumer mode is active. Marketplace browsing and booking are available from this workspace.</p>
              </div>
            )}
          </div>

          <div className="workspaceSidebarSection">
            <h3 className="sectionLabel">Workspace navigation</h3>
            <WorkspaceNav role={profile?.role ?? "consumer"} />
          </div>

          <div className="workspaceSidebarSection">
            <h3 className="sectionLabel">Legacy tools</h3>
            {activeOrganization ? (
              <div className="card subtle">
                <strong>{activeOrganization.name}</strong>
                <p className="helper">
                  Organization and billing controls are still available, but they are no longer part of the main Swift Slots path.
                </p>
                <div className="meta topSpacing">
                  <span className="tag">{activeRole ?? "member"}</span>
                  <span className="tag">{activeOrganization.slug}</span>
                </div>
                <div className="actions topSpacing">
                  <Link href="/settings/organization" className="buttonSecondary">
                    Open org settings
                  </Link>
                  <Link href="/settings/billing" className="buttonSecondary">
                    Open billing
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card subtle">
                <p className="muted">No legacy organization controls are active for this account. The shell stays focused on the product workflow.</p>
              </div>
            )}
          </div>

          <form action={signOutAction}>
            <button type="submit" className="dangerButton">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <section className="workspaceMain">{children}</section>
    </main>
  );
}
