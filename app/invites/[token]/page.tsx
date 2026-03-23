import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/swift/empty-state";
import { PageHeader } from "@/components/swift/page-header";
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

  if (error || !invitation) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Invitation"
          title="Invite not available"
          description="This invite link is invalid or no longer accessible."
        />
        <EmptyState
          title="Invalid invite"
          description="Open the app and ask an organization owner to resend the invitation if you still need access."
          action={
            <Button asChild>
              <Link href={user ? "/marketplace" : "/auth"}>
                {user ? "Return to app" : "Open sign in"}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Invitation"
        title={`Join ${invitation.organization_name}`}
        description="This is a legacy starter invite surface. It remains available for inherited workspace access, but it is no longer part of the main Swift Slots flow."
        meta={
          <>
            <Badge variant="outline">{invitation.role}</Badge>
            <Badge variant="outline">{invitation.status}</Badge>
          </>
        }
      />

      {query.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Error: {query.error}
        </div>
      ) : null}
      {isExpired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This invite has expired. Ask an organization owner to resend it.
        </div>
      ) : null}

      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle>Invite details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{invitation.email}</Badge>
            <Badge variant="outline">{invitation.role}</Badge>
            <Badge variant="outline">{invitation.status}</Badge>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            {user ? (
              <>
                Signed in as <span className="font-medium text-foreground">{user.email}</span>. The invite can only be
                accepted by the matching email.
              </>
            ) : (
              <>
                Sign in or create an account for{" "}
                <span className="font-medium text-foreground">{invitation.email}</span> to finish onboarding.
              </>
            )}
          </p>

          {user ? (
            <form action={acceptInviteAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" disabled={invitation.status !== "pending" || isExpired}>
                Accept invite
              </Button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link
                  href={`/auth?message=${encodeURIComponent("Sign in to accept this invite.")}&next=${encodeURIComponent(`/invites/${token}`)}`}
                >
                  Continue to sign in
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
