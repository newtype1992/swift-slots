"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    detail: "Workspace summary and recent activity",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    detail: "Browse and book live openings",
    match: (pathname: string) => pathname.startsWith("/marketplace"),
  },
  {
    href: "/settings/profile",
    label: "Profile",
    detail: "Identity, role, and account settings",
    match: (pathname: string) => pathname.startsWith("/settings/profile"),
  },
  {
    href: "/settings/studio",
    label: "Studio",
    detail: "Operator setup and slot publishing",
    match: (pathname: string) => pathname.startsWith("/settings/studio"),
  },
  {
    href: "/settings/organization",
    label: "Starter Org",
    detail: "Legacy workspace controls",
    match: (pathname: string) => pathname.startsWith("/settings/organization"),
  },
  {
    href: "/settings/billing",
    label: "Starter Billing",
    detail: "Inherited subscription tooling",
    match: (pathname: string) => pathname.startsWith("/settings/billing"),
  },
];

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className="workspaceNav">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`workspaceNavLink ${link.match(pathname) ? "workspaceNavLinkActive" : ""}`}
        >
          <span className="navTitle">{link.label}</span>
          <span className="navHint">{link.detail}</span>
        </Link>
      ))}
    </nav>
  );
}
