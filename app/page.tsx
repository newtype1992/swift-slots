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
        <p className="eyebrow">Backend First Starter</p>
        <h1 className="headline">Ship the SaaS shell before the SaaS idea changes.</h1>
        <p className="subhead">
          This starter now includes Supabase auth, organization creation, and a protected dashboard.
          The schema stays migrations-first, while the app proves the stack actually works end to end.
        </p>
        <div className="actions">
          <Link href={user ? "/dashboard" : "/auth"} className="button">
            {user ? "Open dashboard" : "Create an account"}
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
              <h3>Organization bootstrap</h3>
              <p className="muted">
                New users can create an organization through the existing `create_organization` database RPC.
              </p>
            </div>
            <div className="card">
              <h3>Protected dashboard</h3>
              <p className="muted">
                Authenticated users can see their profile and organization records gated by RLS.
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <h2>Why this is the right next slice</h2>
          <div className="stack">
            <p className="muted">
              The template now proves the critical path for future SaaS ideas: identity, tenancy, and the
              first successful post-signup action.
            </p>
            <div className="meta">
              <span className="tag">Supabase Auth</span>
              <span className="tag">RLS-backed orgs</span>
              <span className="tag">Next.js SSR</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
