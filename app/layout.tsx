import type { Metadata } from "next";
import { IBM_Plex_Mono, Geist } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
