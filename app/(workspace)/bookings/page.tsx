import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingCard } from "@/components/bookings/booking-card";
import { EmptyState } from "@/components/swift/empty-state";
import { PageHeader } from "@/components/swift/page-header";
import { getConsumerBookings } from "@/lib/marketplace/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type BookingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, profile, user } = await requireWorkspaceShellContext();

  if (profile?.role !== "consumer") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Bookings"
          title="Consumer mode required"
          description="Switch this account to consumer mode to review booking confirmations and payment states."
          actions={
            <Button asChild>
              <Link href="/settings/profile">Update account role</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const bookings = await getConsumerBookings({
    supabase,
    consumerUserId: user.id,
  });
  const paidCount = bookings.filter((booking) => booking.payment_status === "paid").length;
  const pendingCount = bookings.filter((booking) => booking.payment_status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bookings"
        title="Your confirmed and pending reservations"
        description="This route keeps booking history separate from marketplace discovery so consumers can move between browsing and confirmation without clutter."
        meta={
          <>
            <Badge variant="outline">{bookings.length} total</Badge>
            <Badge variant="outline">{paidCount} paid</Badge>
            <Badge variant="outline">{pendingCount} pending</Badge>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/settings/profile">Profile settings</Link>
            </Button>
            <Button asChild>
              <Link href="/marketplace">Open marketplace</Link>
            </Button>
          </>
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

      {bookings.length > 0 ? (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No bookings yet"
          description="Once you reserve a class, its confirmation and payment state will appear here."
          action={
            <Button asChild>
              <Link href="/marketplace">Browse live openings</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
