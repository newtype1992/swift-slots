import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AddressFields } from "@/components/address-fields";
import { NativeSelect } from "@/components/swift/native-select";
import { PageHeader } from "@/components/swift/page-header";
import { formatAddress } from "@/lib/location";
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
  const savedAddress = formatAddress({
    addressLine1: profile?.address_line1,
    addressLine2: profile?.address_line2,
    city: profile?.city,
    province: profile?.province,
    postalCode: profile?.postal_code,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Account and fallback location"
        description="Keep profile information separate from studio management and legacy workspace administration."
        meta={
          <>
            <Badge variant="outline">{profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}</Badge>
            <Badge variant="outline">{savedAddress ? "Location saved" : "No saved location"}</Badge>
          </>
        }
        actions={
          profile?.role === "studio_operator" ? (
            <Button asChild>
              <Link href="/settings/studio">Open studio profile</Link>
            </Button>
          ) : undefined
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

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Current identity</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Quick account context and the remaining starter-era access that is still attached to this login.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email</p>
              <p className="mt-2 font-medium text-foreground">{profile?.email ?? user.email ?? "Unknown email"}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Role</p>
              <p className="mt-2 font-medium text-foreground">
                {profile?.role === "studio_operator" ? "Studio operator" : "Consumer"}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {profile?.role === "studio_operator"
                  ? studio
                    ? `Studio linked: ${studio.name}`
                    : "No studio profile created yet."
                  : "This account can browse live openings and fall back to the saved address if device location is unavailable."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saved fallback location</p>
              <p className="mt-2 font-medium text-foreground">{savedAddress || "No saved address yet"}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {profile?.latitude && profile?.longitude
                  ? "Ready to use when device geolocation is unavailable."
                  : "Add an address to enable marketplace fallback when location permission is denied."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Legacy workspace access</p>
              <p className="mt-2 font-medium text-foreground">{organizations.length} organizations</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {activeOrganization
                  ? `Active starter workspace: ${activeOrganization.name}. These controls are now hidden from the primary product navigation.`
                  : "No inherited starter workspace is selected right now."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Edit profile</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Email and authentication methods remain managed by Supabase Auth. Role and fallback location stay here.
            </p>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="grid gap-4">
              <input type="hidden" name="redirectTo" value="/settings/profile" />

              <div className="grid gap-2">
                <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                  Full name
                </label>
                <Input
                  id="full-name"
                  name="fullName"
                  type="text"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="Your display name"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="role" className="text-sm font-medium text-foreground">
                  Account role
                </label>
                <NativeSelect id="role" name="role" defaultValue={profile?.role ?? "consumer"}>
                  <option value="consumer">Consumer</option>
                  <option value="studio_operator">Studio operator</option>
                </NativeSelect>
              </div>

              <AddressFields
                section="profile"
                addressLine1Name="addressLine1"
                addressLine1Id="profile-address-line1"
                addressLine1Label="Saved fallback address"
                addressLine1Value={profile?.address_line1}
                addressLine2Name="addressLine2"
                addressLine2Id="profile-address-line2"
                addressLine2Value={profile?.address_line2}
                cityName="city"
                cityId="profile-city"
                cityValue={profile?.city}
                provinceName="province"
                provinceId="profile-province"
                provinceValue={profile?.province}
                postalCodeName="postalCode"
                postalCodeId="profile-postal-code"
                postalCodeValue={profile?.postal_code}
                countryCodeValue={profile?.country_code || "CA"}
                helperText="Used only when device location is unavailable or permission is denied."
              />

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit">Save profile</Button>
                {profile?.role === "studio_operator" ? (
                  <Button asChild variant="outline">
                    <Link href="/settings/studio">Studio profile</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
