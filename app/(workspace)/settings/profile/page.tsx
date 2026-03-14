import Link from "next/link";
import { updateProfileAction } from "../actions";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type ProfileSettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProfileSettingsPage({ searchParams }: ProfileSettingsPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, profile, user, organizations, activeOrganization } = await requireWorkspaceShellContext();
  const { studio } =
    profile?.role === "studio_operator"
      ? await getOperatorStudioSnapshot({
          supabase,
          userId: user.id,
        })
      : { studio: null };

  return (
    <div className="grid">
      <section className="panel">
        <p className="eyebrow">Profile</p>
        <h2>Account settings</h2>
        <p className="muted">
          Keep profile information separate from workspace administration so the starter has a cleaner default IA.
        </p>
        {params.error ? <p className="message">Error: {params.error}</p> : null}
        {params.message ? <p className="message">{params.message}</p> : null}
      </section>

      <section className="grid two">
        <article className="panel">
          <h3>Identity</h3>
          <div className="list compact">
            <div className="card subtle">
              <span className="helper">Email</span>
              <strong>{profile?.email ?? user.email ?? "Unknown email"}</strong>
            </div>
            <div className="card subtle">
              <span className="helper">Role</span>
              <strong>{profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}</strong>
              <p className="helper">
                {profile?.role === "studio_operator"
                  ? studio
                    ? `Studio linked: ${studio.name}`
                    : "No studio profile created yet."
                  : "This account will eventually browse and book marketplace slots."}
              </p>
            </div>
            <div className="card subtle">
              <span className="helper">User ID</span>
              <p className="helper mono">{user.id}</p>
            </div>
            <div className="card subtle">
              <span className="helper">Workspace access</span>
              <strong>{organizations.length} organizations</strong>
              <p className="helper">
                {activeOrganization ? `Active workspace: ${activeOrganization.name}` : "No active workspace selected yet."}
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <h3>Public profile</h3>
          <form action={updateProfileAction} className="form">
            <input type="hidden" name="redirectTo" value="/settings/profile" />
            <div className="field">
              <label htmlFor="full-name">Full name</label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                defaultValue={profile?.full_name ?? ""}
                placeholder="Your display name"
              />
            </div>
            <div className="field">
              <label htmlFor="role">Account role</label>
              <select id="role" name="role" className="select" defaultValue={profile?.role ?? "consumer"}>
                <option value="consumer">Consumer</option>
                <option value="studio_operator">Studio operator</option>
              </select>
            </div>
            <button type="submit" className="button">
              Save profile
            </button>
          </form>
          <p className="helper">
            Email and authentication methods remain managed by Supabase Auth. Studio operators create or edit the actual
            studio record from the dedicated studio settings screen.
          </p>
          {profile?.role === "studio_operator" ? (
            <div className="actions topSpacing">
              <Link href="/settings/studio" className="buttonSecondary">
                Open studio settings
              </Link>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
