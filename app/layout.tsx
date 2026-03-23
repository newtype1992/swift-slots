import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Geist } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} ${plexMono.variable} bg-background text-foreground antialiased`}>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 pb-12 lg:px-6">
          <header className="sticky top-4 z-20 mt-4 rounded-3xl border border-white/75 bg-white/80 px-4 py-3 shadow-[0_18px_42px_-28px_rgba(71,85,105,0.35)] ring-1 ring-white/65 backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
                  Swift Slots
                </Link>
                <span className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                  Montreal beta
                </span>
              </div>
              <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <Link href="/marketplace" className="transition-colors hover:text-primary">
                  Browse classes
                </Link>
                <Link href="/settings/studio" className="transition-colors hover:text-primary">
                  For studios
                </Link>
                <Link href="/wireframes" className="transition-colors hover:text-primary">
                  Wireframes
                </Link>
              </nav>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/auth">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/marketplace">Open app</Link>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
