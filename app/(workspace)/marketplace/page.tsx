import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/swift/notice";
import { PageHeader } from "@/components/swift/page-header";
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketplace"
          title="Consumer mode required"
          description="Switch this account to consumer mode to browse and book marketplace slots."
          actions={
            <Button asChild>
              <Link href="/settings/profile">Update account role</Link>
            </Button>
          }
        />
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Book a last-minute class"
        description="Available inventory is already filtered by booking rules, including the 15-minute lock window. Filters below help consumers scan quickly without burying the core booking path."
        meta={
          <>
            <Badge variant="outline">{slots.length} visible now</Badge>
            <Badge variant="outline">{savedCoordinates ? "Fallback location ready" : "No fallback location"}</Badge>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/bookings">Open bookings</Link>
            </Button>
            <Button asChild>
              <Link href="/settings/profile">Update profile</Link>
            </Button>
          </>
        }
      />

      {params.error ? <Notice tone="error">Error: {params.error}</Notice> : null}
      {params.message ? <Notice tone="success">{params.message}</Notice> : null}

      <MarketplaceResults
        slots={slots}
        savedCoordinates={savedCoordinates}
        savedAddressLabel={savedAddressLabel || null}
      />
    </div>
  );
}
