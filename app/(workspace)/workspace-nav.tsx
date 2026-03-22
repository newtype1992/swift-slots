"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
            href: "/settings/studio",
            label: "Studio",
            detail: "Studio identity and slot publishing",
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
            href: "/dashboard",
            label: "Dashboard",
            detail: "Consumer overview and next actions",
            match: (currentPath: string) => currentPath === "/dashboard",
          },
          {
            href: "/marketplace",
            label: "Marketplace",
            detail: "Browse and book live openings",
            match: (currentPath: string) => currentPath.startsWith("/marketplace"),
          },
          {
            href: "/settings/profile",
            label: "Profile",
            detail: "Identity and saved location",
            match: (currentPath: string) => currentPath.startsWith("/settings/profile"),
          },
        ];

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
