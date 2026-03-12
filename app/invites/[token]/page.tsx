import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInviteAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type InviteRecord = {
  invite_id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = await params;
  const query = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const { data: invitation, error } = await supabase
    .rpc("get_invitation_by_token", {
      p_token: token,
    })
    .maybeSingle<InviteRecord>();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isExpired = invitation ? new Date(invitation.expires_at) < new Date() : false;

  return (
    <main className="grid">
      <section className="panel">
        <p className="eyebrow">Invitation</p>
        <h1>Join organization</h1>
        {query.error ? <p className="message">Error: {query.error}</p> : null}
        {error || !invitation ? (
          <div className="stack">
            <p className="message">This invite link is invalid or no longer available.</p>
            <Link href={user ? "/dashboard" : "/auth"} className="buttonSecondary">
              {user ? "Return to dashboard" : "Open sign in"}
            </Link>
          </div>
        ) : (
          <div className="stack">
            <div className="card">
              <h3>{invitation.organization_name}</h3>
              <div className="meta">
                <span className="tag">{invitation.role}</span>
                <span className="tag">{invitation.email}</span>
                <span className="tag">{invitation.status}</span>
              </div>
              <p className="helper">
                {user ? (
                  <>
                    Signed in as <strong>{user.email}</strong>. The invite can only be accepted by the matching
                    email.
                  </>
                ) : (
                  <>
                    Sign in or create an account for <strong>{invitation.email}</strong> to finish onboarding.
                  </>
                )}
              </p>
            </div>
            {isExpired ? <p className="message">This invite has expired. Ask an organization owner to resend it.</p> : null}
            {user ? (
              <form action={acceptInviteAction}>
                <input type="hidden" name="token" value={token} />
                <button type="submit" className="button" disabled={invitation.status !== "pending" || isExpired}>
                  Accept invite
                </button>
              </form>
            ) : (
              <div className="actions">
                <Link
                  href={`/auth?message=${encodeURIComponent("Sign in to accept this invite.")}&next=${encodeURIComponent(`/invites/${token}`)}`}
                  className="button"
                >
                  Continue to sign in
                </Link>
                <Link href="/" className="buttonSecondary">
                  Return home
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
