import Link from "next/link";
import { ArrowRight, Building2, MapPin, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const featuredSlots = [
  {
    title: "Hot Flow Recovery",
    studio: "Mile End Yoga",
    time: "Today 6:30 PM",
    meta: "45 min",
    price: "$14",
    originalPrice: "$28",
    discount: "50% off",
  },
  {
    title: "HIIT Express",
    studio: "Plateau Strength",
    time: "In 90 min",
    meta: "35 min",
    price: "$12",
    originalPrice: "$24",
    discount: "50% off",
  },
  {
    title: "Pilates Core Lab",
    studio: "Rosemont Reform",
    time: "Tomorrow 8:00 AM",
    meta: "50 min",
    price: "$16",
    originalPrice: "$30",
    discount: "47% off",
  },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const primaryHref = user ? "/marketplace" : "/auth";

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Live marketplace</Badge>
              <Badge variant="outline">Two-role product</Badge>
              <Badge variant="outline">Montreal only</Badge>
            </div>
            <div className="space-y-3">
              <CardTitle className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                Fill last-minute boutique fitness openings without forcing consumers through a generic dashboard.
              </CardTitle>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Swift Slots splits discovery, bookings, studio setup, and slot management into clear routes. Consumers
                book fast. Operators manage inventory without inherited starter clutter taking over the UI.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={primaryHref}>
                  {user ? "Open marketplace" : "Sign in to start"}
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/wireframes">Review approved wireframes</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                <MapPin className="size-4 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">Consumer discovery</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Marketplace first, then slot detail, checkout, and booking confirmation.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                <Building2 className="size-4 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">Operator structure</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Dashboard for summary, Studio for identity, Slots for posting and monitoring.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                <Ticket className="size-4 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">Pricing clarity</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Original price and discount percent stay explicit across the whole booking flow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Review path
            </p>
            <CardTitle>What to check next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>1. Sign in as `consumer.demo@swiftslots.test` and review Marketplace, slot detail, and Bookings.</p>
            <p>2. Sign in as `studio.olive@swiftslots.test` and review Dashboard, Studio, and Slots.</p>
            <p>3. Confirm the nav feels shallow, obvious, and role-specific.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Marketplace preview</p>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Example live openings</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {featuredSlots.map((slot) => (
            <Card key={`${slot.title}-${slot.studio}`} className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{slot.time}</Badge>
                  <Badge variant="outline">{slot.meta}</Badge>
                  <Badge>{slot.discount}</Badge>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{slot.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{slot.studio}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tracking-tight text-foreground">{slot.price}</p>
                    <p className="text-xs text-muted-foreground line-through">{slot.originalPrice}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={primaryHref}>Review booking flow</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
