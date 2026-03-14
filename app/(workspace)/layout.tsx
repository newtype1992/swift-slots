import { setActiveOrganizationAction, signOutAction } from "@/app/dashboard/actions";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";
import { WorkspaceNav } from "./workspace-nav";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { activeOrganization, activeRole, organizations, profile, supabase, user } = await requireWorkspaceShellContext();
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
          <div>
            <p className="eyebrow">Swift Slots</p>
            <h1 className="workspaceHeading">Operator and consumer workspace</h1>
            <p className="muted">
              The shell now centers product role, studio setup, and the next workflow slice while inherited starter tools remain available.
            </p>
          </div>

          <div className="card subtle">
            <h3>Current account</h3>
            <p className="muted">{profile?.email ?? "Unknown email"}</p>
            <div className="meta">
              <span className="tag">{profile?.full_name || "No profile name yet"}</span>
              <span className="tag">{profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}</span>
            </div>
          </div>

          <div className="stack compactStack">
            <h3 className="sectionLabel">Product status</h3>
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
                <p className="muted">Consumer mode is set. Marketplace browsing and booking will be the next major slice.</p>
              </div>
            )}
          </div>

          <div className="stack compactStack">
            <h3 className="sectionLabel">Workspace navigation</h3>
            <WorkspaceNav />
          </div>

          <div className="stack compactStack">
            <h3 className="sectionLabel">Inherited starter workspace</h3>
            {activeOrganization ? (
              <>
                <div className="card subtle">
                  <strong>{activeOrganization.name}</strong>
                  <div className="meta topSpacing">
                    <span className="tag">{activeOrganization.slug}</span>
                    <span className="tag">{activeRole ?? "member"}</span>
                  </div>
                </div>
                <form action={setActiveOrganizationAction} className="form">
                  <input type="hidden" name="redirectTo" value="/dashboard" />
                  <div className="field">
                    <label htmlFor="active-org-picker">Switch workspace</label>
                    <select
                      id="active-org-picker"
                      name="organizationId"
                      className="select"
                      defaultValue={activeOrganization.id}
                    >
                      {organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="buttonSecondary">
                    Update active workspace
                  </button>
                </form>
              </>
            ) : (
              <div className="card subtle">
                <p className="muted">The inherited organization layer is still available, but Swift Slots product flows no longer depend on it.</p>
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
