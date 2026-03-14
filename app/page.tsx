import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="grid">
      <section className="hero">
        <p className="eyebrow">Last-minute fitness marketplace</p>
        <h1 className="headline">Fill canceled class spots before they stay empty.</h1>
        <p className="subhead">
          Swift Slots helps Montreal fitness studios publish discounted last-minute openings and gives spontaneous consumers a simple path to book them.
        </p>
        <div className="actions">
          <Link href={user ? "/dashboard" : "/auth"} className="button">
            {user ? "Open workspace" : "Create an account"}
          </Link>
          <a href="http://127.0.0.1:54323" className="buttonSecondary" target="_blank" rel="noreferrer">
            Open Supabase Studio
          </a>
        </div>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>What works now</h2>
          <div className="list">
            <div className="card">
              <h3>Email auth</h3>
              <p className="muted">
                Sign up and sign in against your local Supabase instance with SSR-safe session handling.
              </p>
            </div>
            <div className="card">
              <h3>Role-aware accounts</h3>
              <p className="muted">
                Profiles now distinguish studio operators from consumers so the product can branch into separate flows.
              </p>
            </div>
            <div className="card">
              <h3>Studio management foundation</h3>
              <p className="muted">
                Operators can create a studio profile and publish discounted open slots through the protected workspace.
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <h2>What comes next</h2>
          <div className="stack">
            <p className="muted">
              The next slice is the consumer marketplace: nearby slot browsing, slot detail, and a safe booking flow on top of the new schema and policies.
            </p>
            <div className="meta">
              <span className="tag">Supabase Auth</span>
              <span className="tag">Studio profiles</span>
              <span className="tag">Slot posting</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
