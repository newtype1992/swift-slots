import Link from "next/link";
import { formatAddress, getProfileCoordinates } from "@/lib/location";
import { getMarketplaceSlots } from "@/lib/marketplace/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";
import { MarketplaceResults } from "./marketplace-results";

type MarketplacePageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, profile } = await requireWorkspaceShellContext();

  if (profile?.role !== "consumer") {
    return (
      <div className="grid">
        <section className="panel">
          <p className="eyebrow">Marketplace</p>
          <h1>Consumer mode required</h1>
          <p className="muted">Switch this account to the consumer role to browse and book marketplace slots.</p>
          {params.error ? <p className="message">Error: {params.error}</p> : null}
          {params.message ? <p className="message">{params.message}</p> : null}
          <div className="actions">
            <Link href="/settings/profile" className="button">
              Update account role
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const slots = await getMarketplaceSlots({
    supabase,
  });
  const savedCoordinates = getProfileCoordinates(profile);
  const savedAddressLabel = formatAddress({
    addressLine1: profile?.address_line1,
    addressLine2: profile?.address_line2,
    city: profile?.city,
    province: profile?.province,
    postalCode: profile?.postal_code,
  });

  return (
    <div className="grid">
      <section className="panel">
        <div className="sectionHeader">
          <div className="stack compactStack">
            <p className="eyebrow">Marketplace</p>
            <h1>Book a last-minute class</h1>
            <p className="muted">
              Available inventory is already filtered by Supabase booking rules, including the 15-minute lock window, and ranked using your device location whenever available.
            </p>
          </div>
          <div className="metricCard">
            <p className="eyebrow">Visible now</p>
            <div className="metricValue">{slots.length}</div>
            <p className="helper">Slots open to this consumer right now.</p>
          </div>
        </div>
        {params.error ? <p className="message">Error: {params.error}</p> : null}
        {params.message ? <p className="message">{params.message}</p> : null}
      </section>

      <MarketplaceResults
        slots={slots}
        savedCoordinates={savedCoordinates}
        savedAddressLabel={savedAddressLabel || null}
      />
    </div>
  );
}
