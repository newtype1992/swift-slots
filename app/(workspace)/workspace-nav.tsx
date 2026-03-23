"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type WorkspaceNavProps = {
  role: "studio_operator" | "consumer";
};

export function WorkspaceNav({ role }: WorkspaceNavProps) {
  const pathname = usePathname();
  const links =
    role === "studio_operator"
      ? [
          {
            href: "/dashboard",
            label: "Dashboard",
            detail: "Operator overview and next actions",
            match: (currentPath: string) => currentPath === "/dashboard",
          },
          {
            href: "/slots",
            label: "Slots",
            detail: "Post and monitor live inventory",
            match: (currentPath: string) => currentPath.startsWith("/slots"),
          },
          {
            href: "/settings/studio",
            label: "Studio",
            detail: "Studio identity and marketplace profile",
            match: (currentPath: string) => currentPath.startsWith("/settings/studio"),
          },
          {
            href: "/settings/profile",
            label: "Profile",
            detail: "Identity and account mode",
            match: (currentPath: string) => currentPath.startsWith("/settings/profile"),
          },
        ]
      : [
          {
            href: "/marketplace",
            label: "Marketplace",
            detail: "Browse and book live openings",
            match: (currentPath: string) =>
              currentPath === "/marketplace" || /^\/marketplace\/[^/]+$/.test(currentPath),
          },
          {
            href: "/bookings",
            label: "Bookings",
            detail: "See confirmations and payment states",
            match: (currentPath: string) =>
              currentPath.startsWith("/bookings") || currentPath.startsWith("/marketplace/bookings"),
          },
          {
            href: "/settings/profile",
            label: "Profile",
            detail: "Identity and saved location",
            match: (currentPath: string) => currentPath.startsWith("/settings/profile"),
          },
        ];

  return (
    <nav className="grid gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-2xl border px-4 py-3 transition-all duration-150",
            "hover:border-border/80 hover:bg-white/72 hover:text-foreground",
            link.match(pathname)
              ? "border-primary/15 bg-[linear-gradient(180deg,rgba(109,82,255,0.08),rgba(83,193,255,0.08))] text-foreground shadow-[0_16px_32px_-28px_rgba(109,82,255,0.55)]"
              : "border-transparent text-muted-foreground"
          )}
        >
          <span className="block text-sm font-semibold text-current">{link.label}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{link.detail}</span>
        </Link>
      ))}
    </nav>
  );
}
