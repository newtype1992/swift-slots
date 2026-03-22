import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Instrument_Sans, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} ${plexMono.variable}`}>
        <div className="shell appShell">
          <header className="siteHeader">
            <div className="brandLockup">
              <Link href="/" className="brand">
                Swift Slots
              </Link>
              <span className="brandBadge">Montreal beta</span>
            </div>
            <nav className="headerNav">
              <Link href="/marketplace" className="headerNavLink">
                Browse classes
              </Link>
              <Link href="/" className="headerNavLink">
                How it works
              </Link>
              <Link href="/settings/studio" className="headerNavLink">
                For studios
              </Link>
            </nav>
            <div className="headerActions">
              <Link href="/auth" className="buttonSecondary">
                Sign in
              </Link>
              <Link href="/dashboard" className="button">
                Open workspace
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
