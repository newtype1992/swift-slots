import Link from "next/link";
import { signInAction, signUpAction } from "./actions";

type AuthPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = (await searchParams) ?? {};
  const next = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <main className="grid two">
      <section className="panel">
        <p className="eyebrow">Access</p>
        <h1>Sign in to Swift Slots</h1>
        <p className="muted">
          Use the local Supabase stack to create an account, establish a session, and move directly into the Swift Slots workspace.
        </p>
        <div className="stack">
          <p className="helper">No seeded user is required. Local email confirmations are disabled right now.</p>
          <Link href="http://127.0.0.1:54324" className="buttonSecondary">
            Open local inbox
          </Link>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Sign in</h2>
          {params.error ? <p className="message">Error: {params.error}</p> : null}
          {params.message ? <p className="message">{params.message}</p> : null}
          <form action={signInAction} className="form">
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="sign-in-email">Email</label>
              <input id="sign-in-email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="sign-in-password">Password</label>
              <input id="sign-in-password" name="password" type="password" minLength={6} required />
            </div>
            <button type="submit" className="button">
              Sign in
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Create account</h2>
          <form action={signUpAction} className="form">
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="sign-up-email">Email</label>
              <input id="sign-up-email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="sign-up-password">Password</label>
              <input id="sign-up-password" name="password" type="password" minLength={6} required />
            </div>
            <button type="submit" className="button">
              Create account
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
