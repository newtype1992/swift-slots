import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="grid">
      <section className="hero heroGrid">
        <div className="stack">
          <p className="eyebrow">Last-minute fitness marketplace</p>
          <h1 className="headline">Resell canceled class spots before they go dark.</h1>
          <p className="subhead">
            Swift Slots gives Montreal studios a clean operator flow for posting discounted openings and gives consumers a fast path to claim them.
          </p>
          <div className="actions">
            <Link href={user ? "/dashboard" : "/auth"} className="button">
              {user ? "Open workspace" : "Create an account"}
            </Link>
            <a href="http://127.0.0.1:54323" className="buttonSecondary" target="_blank" rel="noreferrer">
              Open Supabase Studio
            </a>
          </div>
        </div>

        <aside className="heroAside">
          <div>
            <p className="eyebrow">Live product</p>
            <h2>Current scope</h2>
          </div>
          <div className="list compact">
            <div className="splitRow">
              <span className="helper">Studio setup</span>
              <strong>Ready</strong>
            </div>
            <div className="splitRow">
              <span className="helper">Marketplace booking</span>
              <strong>Ready</strong>
            </div>
            <div className="splitRow">
              <span className="helper">Stripe checkout</span>
              <strong>Ready</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="metricGrid">
        <article className="metricCard">
          <p className="eyebrow">Operators</p>
          <div className="metricValue">Studios</div>
          <p className="helper">Create a studio profile, define categories, and post discounted slots.</p>
        </article>
        <article className="metricCard">
          <p className="eyebrow">Consumers</p>
          <div className="metricValue">Book</div>
          <p className="helper">Browse current inventory, review pricing, and pay through Stripe Checkout.</p>
        </article>
        <article className="metricCard">
          <p className="eyebrow">Backend</p>
          <div className="metricValue">RLS</div>
          <p className="helper">Supabase policies enforce role separation, visibility, and booking boundaries.</p>
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="sectionHeader">
            <div className="stack compactStack">
              <p className="eyebrow">Live surface</p>
              <h2>What works now</h2>
            </div>
          </div>
          <div className="list">
            <div className="card subtle">
              <h3>Email auth</h3>
              <p className="muted">
                Sign up and sign in against your local Supabase instance with SSR-safe session handling.
              </p>
            </div>
            <div className="card subtle">
              <h3>Role-aware accounts</h3>
              <p className="muted">
                Profiles now distinguish studio operators from consumers so the product can branch into separate flows.
              </p>
            </div>
            <div className="card subtle">
              <h3>Studio and marketplace flow</h3>
              <p className="muted">
                Operators can post slots and consumers can book them through the protected workspace and Stripe checkout.
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="sectionHeader">
            <div className="stack compactStack">
              <p className="eyebrow">Roadmap</p>
              <h2>What comes next</h2>
            </div>
          </div>
          <div className="stack">
            <p className="muted">
              The next product layer is discovery: location-aware ranking, fallback address logic, and tighter marketplace filtering around time, distance, and class type.
            </p>
            <div className="meta">
              <span className="tag">Device geolocation</span>
              <span className="tag">Profile fallback</span>
              <span className="tag">Nearby ranking</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
