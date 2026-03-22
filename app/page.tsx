import Link from "next/link";
import { DealCard } from "@/components/marketplace/deal-card";
import { FilterChip } from "@/components/ui/filter-chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const featuredSlots = [
  {
    eyebrow: "Live slot",
    title: "Hot Flow Recovery",
    subtitle: "Mile End Yoga",
    price: "$14",
    originalPrice: "$28",
    badges: ["Today 6:30 PM", "45 min", "50% off"],
    href: "/auth",
    ctaLabel: "Book now",
    tone: "navy" as const,
    visualLabel: "Heat + Restore",
  },
  {
    eyebrow: "Fresh drop",
    title: "HIIT Express",
    subtitle: "Plateau Strength",
    price: "$12",
    originalPrice: "$24",
    badges: ["In 90 min", "35 min", "50% off"],
    href: "/auth",
    ctaLabel: "Book now",
    tone: "coral" as const,
    visualLabel: "Fast Burn",
  },
  {
    eyebrow: "Open spot",
    title: "Deep Stretch Reset",
    subtitle: "Atwater Mobility",
    price: "$18",
    originalPrice: "$32",
    badges: ["Tonight 7:15 PM", "60 min", "44% off"],
    href: "/auth",
    ctaLabel: "Book now",
    tone: "gold" as const,
    visualLabel: "Calm + Lengthen",
  },
  {
    eyebrow: "Last minute",
    title: "Pilates Core Lab",
    subtitle: "Rosemont Reform",
    price: "$16",
    originalPrice: "$30",
    badges: ["Tomorrow 8:00 AM", "50 min", "47% off"],
    href: "/auth",
    ctaLabel: "Book now",
    tone: "teal" as const,
    visualLabel: "Core Focus",
  },
  {
    eyebrow: "Few left",
    title: "Run Club Tempo",
    subtitle: "Canal Track House",
    price: "$8",
    originalPrice: "$16",
    badges: ["Today 5:45 PM", "40 min", "50% off"],
    href: "/auth",
    ctaLabel: "Book now",
    tone: "slate" as const,
    visualLabel: "Pace Session",
  },
  {
    eyebrow: "Just added",
    title: "Boxing Conditioning",
    subtitle: "St Henri Combat",
    price: "$15",
    originalPrice: "$29",
    badges: ["Tonight 8:15 PM", "50 min", "48% off"],
    href: "/auth",
    ctaLabel: "Book now",
    tone: "coral" as const,
    visualLabel: "Power Round",
  },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="marketingPage">
      <section className="landingHero">
        <div className="landingHeroCopy">
          <span className="landingBadge">Live classes nearby</span>
          <h1>
            Grab cancelled slots.
            <span> Train today. Save big.</span>
          </h1>
          <p>
            Discover discounted same-day fitness classes from Montreal studios. Studios recover revenue and consumers
            book fast before openings disappear.
          </p>
          <div className="landingHeroActions">
            <Link href={user ? "/marketplace" : "/auth"} className="button">
              Browse classes now
            </Link>
            <Link href={user ? "/settings/studio" : "/auth"} className="buttonSecondary">
              For studios
            </Link>
          </div>
          <div className="landingHeroMeta">
            <span>Live inventory updates</span>
            <span>Montreal only</span>
            <span>Secure checkout</span>
          </div>
        </div>
      </section>

      <section className="dealSection">
        <SectionHeading
          eyebrow="Marketplace"
          title="Classes happening now"
          description="Book the last-minute openings that are already discounted and still live in the app."
        />
        <div className="filterChipRow">
          <FilterChip label="All classes" active />
          <FilterChip label="Yoga" />
          <FilterChip label="HIIT" />
          <FilterChip label="Recovery" />
          <FilterChip label="Pilates" />
          <FilterChip label="Run club" />
        </div>
        <div className="dealGrid">
          {featuredSlots.map((slot) => (
            <DealCard key={`${slot.title}-${slot.subtitle}`} {...slot} />
          ))}
        </div>
      </section>
    </main>
  );
}
