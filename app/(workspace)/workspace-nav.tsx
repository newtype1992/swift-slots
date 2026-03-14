"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/settings/profile",
    label: "Profile",
    match: (pathname: string) => pathname.startsWith("/settings/profile"),
  },
  {
    href: "/settings/studio",
    label: "Studio",
    match: (pathname: string) => pathname.startsWith("/settings/studio"),
  },
  {
    href: "/settings/organization",
    label: "Starter Org",
    match: (pathname: string) => pathname.startsWith("/settings/organization"),
  },
  {
    href: "/settings/billing",
    label: "Starter Billing",
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
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
