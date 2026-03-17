"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/settings/profile", label: "Profile", detail: "Account identity and role" },
  { href: "/settings/studio", label: "Studio", detail: "Operator setup and slot inventory" },
  { href: "/settings/organization", label: "Starter Org", detail: "Legacy org administration" },
  { href: "/settings/billing", label: "Starter Billing", detail: "Inherited plan and usage controls" },
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
          <span className="navTitle">{link.label}</span>
          <span className="navHint">{link.detail}</span>
        </Link>
      ))}
    </div>
  );
}
