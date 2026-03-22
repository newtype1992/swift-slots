"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SettingsNavProps = {
  role: "studio_operator" | "consumer";
};

export function SettingsNav({ role }: SettingsNavProps) {
  const pathname = usePathname();
  const links =
    role === "studio_operator"
      ? [
          { href: "/settings/profile", label: "Profile", detail: "Account identity and operator mode" },
          { href: "/settings/studio", label: "Studio", detail: "Studio identity and slot inventory" },
        ]
      : [{ href: "/settings/profile", label: "Profile", detail: "Account identity and saved location" }];

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
