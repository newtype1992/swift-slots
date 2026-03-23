"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
    <div className="grid gap-2 md:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-2xl border px-4 py-3 transition-all duration-150",
            pathname === link.href
              ? "border-primary/15 bg-[linear-gradient(180deg,rgba(109,82,255,0.08),rgba(83,193,255,0.08))] text-foreground shadow-[0_16px_32px_-28px_rgba(109,82,255,0.55)]"
              : "border-transparent bg-transparent text-muted-foreground hover:border-border/80 hover:bg-white/72 hover:text-foreground"
          )}
        >
          <span className="block text-sm font-semibold text-current">{link.label}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{link.detail}</span>
        </Link>
      ))}
    </div>
  );
}
