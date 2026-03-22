import Link from "next/link";
import { AddressFields } from "@/components/address-fields";
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
                  : "This account can browse live openings and falls back to the saved address if device location is unavailable."}
              </p>
            </div>
            <div className="card subtle">
              <span className="helper">User ID</span>
              <p className="helper mono">{user.id}</p>
            </div>
            <div className="card subtle">
              <span className="helper">Legacy workspace access</span>
              <strong>{organizations.length} organizations</strong>
              <p className="helper">
                {activeOrganization
                  ? `Active starter workspace: ${activeOrganization.name}. These controls are now hidden from the primary product navigation.`
                  : "No inherited starter workspace is selected right now."}
              </p>
            </div>
            <div className="card subtle">
              <span className="helper">Saved fallback location</span>
              <strong>{savedAddress || "No saved address yet"}</strong>
              <p className="helper">
                {profile?.latitude && profile?.longitude
                  ? "Ready to use when device geolocation is unavailable."
                  : "Add an address to enable marketplace fallback when location permission is denied."}
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
