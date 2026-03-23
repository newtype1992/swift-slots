import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/swift/empty-state";
import { NativeSelect } from "@/components/swift/native-select";
import { PageHeader } from "@/components/swift/page-header";
import {
  inviteMemberAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
  updateMemberRoleAction,
} from "@/app/dashboard/actions";
import {
  getActiveWorkspaceDetails,
  historyLabel,
  requireWorkspaceShellContext,
} from "@/lib/workspace/server";
import { updateOrganizationDetailsAction } from "../actions";

type OrganizationSettingsPageProps = {
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

export default async function OrganizationSettingsPage({ searchParams }: OrganizationSettingsPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, activeOrganization, activeRole } = await requireWorkspaceShellContext();
  const { members, pendingInvites, inviteHistory, billingSummary } = await getActiveWorkspaceDetails({
    supabase,
    activeOrganizationId: activeOrganization?.id ?? null,
    activeRole,
  });

  if (!activeOrganization) {
    return (
      <EmptyState
        title="No active workspace"
        description="Select or create an organization from the overview page before managing legacy starter settings."
      />
    );
  }

  const ownerControls = activeRole === "owner";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Legacy organization"
        title={`${activeOrganization.name} organization settings`}
        description="These inherited starter controls remain available for migration purposes, but they are no longer part of the main Swift Slots product path."
        meta={
          <>
            <Badge variant="outline">{activeOrganization.slug}</Badge>
            <Badge variant="outline">{activeRole ?? "member"}</Badge>
            <Badge variant="outline">{members.length} members</Badge>
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/settings/billing">Open billing</Link>
          </Button>
        }
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Workspace details</CardTitle>
          </CardHeader>
          <CardContent>
            {ownerControls ? (
              <form action={updateOrganizationDetailsAction} className="grid gap-4">
                <input type="hidden" name="organizationId" value={activeOrganization.id} />
                <div className="grid gap-2">
                  <label htmlFor="organization-name" className="text-sm font-medium text-foreground">
                    Organization name
                  </label>
                  <Input id="organization-name" name="name" type="text" defaultValue={activeOrganization.name} required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="organization-slug" className="text-sm font-medium text-foreground">
                    Organization slug
                  </label>
                  <Input id="organization-slug" name="slug" type="text" defaultValue={activeOrganization.slug} required />
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  Save organization settings
                </Button>
              </form>
            ) : (
              <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                Only organization owners can update name and slug.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Team summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active members</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{members.length}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pending invites</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{pendingInvites.length}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Seat capacity</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {billingSummary ? `${billingSummary.usage.seatsUsed}/${billingSummary.effectivePlan.seatsIncluded}` : "n/a"}
              </p>
            </div>
            <p className="md:col-span-3 text-sm leading-6 text-muted-foreground">
              Need more room? Move to the dedicated <Link href="/settings/billing" className="font-medium text-foreground underline underline-offset-4">billing settings</Link> screen.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length > 0 ? (
            members.map((member) => (
              <div key={member.membership_id} className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{member.email ?? member.user_id}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{member.role}</Badge>
                      <Badge variant="outline">{member.status}</Badge>
                      <Badge variant="outline">{formatDate(member.created_at)}</Badge>
                    </div>
                  </div>
                  {ownerControls && member.role !== "owner" ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={updateMemberRoleAction}>
                        <input type="hidden" name="membershipId" value={member.membership_id} />
                        <input type="hidden" name="role" value={member.role === "admin" ? "member" : "admin"} />
                        <input type="hidden" name="redirectTo" value="/settings/organization" />
                        <Button type="submit" variant="outline">
                          Make {member.role === "admin" ? "member" : "admin"}
                        </Button>
                      </form>
                      <form action={removeMemberAction}>
                        <input type="hidden" name="membershipId" value={member.membership_id} />
                        <input type="hidden" name="redirectTo" value="/settings/organization" />
                        <Button type="submit" variant="destructive">
                          Remove
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No members yet"
              description="No members are visible for this organization right now."
            />
          )}
        </CardContent>
      </Card>

      {ownerControls ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>Invite member</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={inviteMemberAction} className="grid gap-4">
                  <input type="hidden" name="organizationId" value={activeOrganization.id} />
                  <input type="hidden" name="redirectTo" value="/settings/organization" />
                  <div className="grid gap-2">
                    <label htmlFor="invite-email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input id="invite-email" name="email" type="email" required />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="invite-role" className="text-sm font-medium text-foreground">
                      Role
                    </label>
                    <NativeSelect id="invite-role" name="role" defaultValue="member">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </NativeSelect>
                  </div>
                  <Button type="submit" className="w-full md:w-auto">
                    Send invite
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>Pending invites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingInvites.length > 0 ? (
                  pendingInvites.map((invite) => (
                    <div key={invite.invite_id} className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">{invite.email}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">{invite.role}</Badge>
                              <Badge variant="outline">{invite.delivery_status}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <form action={resendInviteAction}>
                              <input type="hidden" name="inviteId" value={invite.invite_id} />
                              <input type="hidden" name="redirectTo" value="/settings/organization" />
                              <Button type="submit" variant="outline">
                                Resend
                              </Button>
                            </form>
                            <form action={revokeInviteAction}>
                              <input type="hidden" name="inviteId" value={invite.invite_id} />
                              <input type="hidden" name="redirectTo" value="/settings/organization" />
                              <Button type="submit" variant="destructive">
                                Revoke
                              </Button>
                            </form>
                          </div>
                        </div>
                        <p className="text-sm break-all text-muted-foreground">{`/invites/${invite.token}`}</p>
                        {invite.delivery_error ? (
                          <p className="text-sm text-rose-700">{invite.delivery_error}</p>
                        ) : null}
                        <p className="text-sm leading-6 text-muted-foreground">
                          Expires {formatDate(invite.expires_at)}.{" "}
                          {invite.last_sent_at ? `Last sent ${formatDate(invite.last_sent_at)}.` : "No email sent yet."}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No pending invites" description="Invite state will appear here after you send one." />
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>Invite history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteHistory.length > 0 ? (
                inviteHistory.map((invite) => (
                  <div key={invite.invite_id} className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">{invite.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{invite.role}</Badge>
                          <Badge variant="outline">{historyLabel(invite)}</Badge>
                          <Badge variant="outline">{invite.delivery_status}</Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground md:text-right">
                        <p>Created {formatDate(invite.created_at)}</p>
                        {invite.accepted_at ? <p>Accepted {formatDate(invite.accepted_at)}</p> : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No invite history in range"
                  description="No invite history is available inside the current plan retention window."
                />
              )}
              <p className="text-sm text-muted-foreground">
                Retention: {billingSummary?.effectivePlan.inviteHistoryLabel ?? "30-day invite history"}.
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
