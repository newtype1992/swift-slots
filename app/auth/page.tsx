import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InsetPanel } from "@/components/swift/inset-panel";
import { Notice } from "@/components/swift/notice";
import { PageHeader } from "@/components/swift/page-header";
import { signInAction, signUpAction } from "./actions";

type AuthPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

const demoAccounts = [
  { role: "Consumer", email: "consumer.demo@swiftslots.test" },
  { role: "Operator", email: "studio.olive@swiftslots.test" },
];

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = (await searchParams) ?? {};
  const next = params.next?.startsWith("/") ? params.next : "/marketplace";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access"
        title="Sign in to Swift Slots"
        description="Use the local Supabase stack to create a session and move directly into the role-specific routes."
        meta={
          <>
            <Badge variant="outline">Consumer marketplace</Badge>
            <Badge variant="outline">Operator slots</Badge>
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="http://127.0.0.1:54324">Open local inbox</Link>
          </Button>
        }
      />

      {params.error ? <Notice tone="error">Error: {params.error}</Notice> : null}
      {params.message ? <Notice tone="success">{params.message}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Demo accounts</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Local seeded users are the fastest way to review the new route split.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoAccounts.map((account) => (
              <InsetPanel key={account.email}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {account.role}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">{account.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">Password: `password123`</p>
              </InsetPanel>
            ))}
            <p className="text-sm leading-6 text-muted-foreground">
              Use `consumer.demo` for Marketplace and Bookings. Use `studio.olive` for Dashboard, Studio, and Slots.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Existing account
              </p>
              <CardTitle>Sign in</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={signInAction} className="grid gap-4">
                <input type="hidden" name="next" value={next} />
                <div className="grid gap-2">
                  <label htmlFor="sign-in-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input id="sign-in-email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="sign-in-password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Input id="sign-in-password" name="password" type="password" minLength={6} required />
                </div>
                <Button type="submit" className="w-full">
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                New account
              </p>
              <CardTitle>Create account</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={signUpAction} className="grid gap-4">
                <input type="hidden" name="next" value={next} />
                <div className="grid gap-2">
                  <label htmlFor="sign-up-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input id="sign-up-email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="sign-up-password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Input id="sign-up-password" name="password" type="password" minLength={6} required />
                </div>
                <Button type="submit" variant="outline" className="w-full">
                  Create account
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
