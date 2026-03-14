"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/studio", label: "Studio" },
  { href: "/settings/organization", label: "Starter Org" },
  { href: "/settings/billing", label: "Starter Billing" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="settingsTabs">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`settingsTab ${pathname === link.href ? "settingsTabActive" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
