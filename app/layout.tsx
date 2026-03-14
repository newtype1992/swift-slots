import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swift Slots",
  description: "A marketplace for discounted last-minute boutique fitness class openings.",
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
              Swift Slots
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
