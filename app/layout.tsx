import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micro SaaS Starter",
  description: "A backend-first Supabase starter with a minimal auth and org dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="nav">
            <Link href="/" className="brand">
              Micro SaaS Starter
            </Link>
            <div className="inline-actions">
              <Link href="/auth" className="buttonSecondary">
                Auth
              </Link>
              <Link href="/dashboard" className="button">
                Dashboard
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
