import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
    <html lang="en">
      <body className={`${instrumentSans.variable} ${plexMono.variable}`}>
        <div className="shell appShell">
          <header className="siteHeader">
            <div className="brandLockup">
              <Link href="/" className="brand">
                Swift Slots
              </Link>
              <span className="brandBadge">Montreal beta</span>
            </div>
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
