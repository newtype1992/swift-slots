"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import {
  BookMarked,
  Building2,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type WorkspaceRole = "studio_operator" | "consumer";

type NavItem = {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  match: (currentPath: string) => boolean;
};

type WorkspaceNavProps = {
  role: WorkspaceRole;
  variant?: "desktop" | "mobile-top" | "mobile-bottom";
  profileEmail?: string | null;
  studioName?: string | null;
  studioLocation?: string | null;
  showLegacyLink?: boolean;
};

const operatorLinks: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    detail: "Operator overview and next actions",
    icon: LayoutDashboard,
    match: (currentPath: string) => currentPath === "/dashboard",
  },
  {
    href: "/slots",
    label: "Slots",
    detail: "Post and monitor live inventory",
    icon: Ticket,
    match: (currentPath: string) => currentPath.startsWith("/slots"),
  },
  {
    href: "/settings/studio",
    label: "Studio",
    detail: "Studio identity and marketplace profile",
    icon: Building2,
    match: (currentPath: string) => currentPath.startsWith("/settings/studio"),
  },
  {
    href: "/settings/profile",
    label: "Profile",
    detail: "Identity and account mode",
    icon: UserRound,
    match: (currentPath: string) => currentPath.startsWith("/settings/profile"),
  },
];

const consumerLinks: NavItem[] = [
  {
    href: "/marketplace",
    label: "Marketplace",
    detail: "Browse and book live openings",
    icon: Compass,
    match: (currentPath: string) =>
      currentPath === "/marketplace" || /^\/marketplace\/[^/]+$/.test(currentPath),
  },
  {
    href: "/bookings",
    label: "Bookings",
    detail: "See confirmations and payment states",
    icon: BookMarked,
    match: (currentPath: string) =>
      currentPath.startsWith("/bookings") || currentPath.startsWith("/marketplace/bookings"),
  },
  {
    href: "/settings/profile",
    label: "Profile",
    detail: "Identity and saved location",
    icon: UserRound,
    match: (currentPath: string) => currentPath.startsWith("/settings/profile"),
  },
];

function linksForRole(role: WorkspaceRole) {
  return role === "studio_operator" ? operatorLinks : consumerLinks;
}

export function WorkspaceNav({
  role,
  variant = "desktop",
  profileEmail,
  studioName,
  studioLocation,
  showLegacyLink = false,
}: WorkspaceNavProps) {
  const pathname = usePathname();
  const links = linksForRole(role);

  if (variant === "mobile-bottom") {
    return (
      <nav
        aria-label="Consumer workspace"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,255,0.98))] px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-18px_42px_-32px_rgba(71,85,105,0.42)] ring-1 ring-white/70 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 rounded-[28px] border border-white/85 bg-white/92 p-2 shadow-[0_24px_60px_-40px_rgba(71,85,105,0.42)]">
          {links.map((link) => {
            const isActive = link.match(pathname);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 rounded-[22px] px-2 py-3 text-center transition-all duration-150",
                  isActive
                    ? "bg-[linear-gradient(180deg,rgba(109,82,255,0.12),rgba(83,193,255,0.12))] text-foreground shadow-[0_16px_32px_-28px_rgba(109,82,255,0.55)]"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-[11px] font-semibold tracking-[0.01em]">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (variant === "mobile-top") {
    return (
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Open workspace menu">
            <Menu />
          </Button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/18 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,calc(100vw-1rem))] flex-col border-l border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,255,0.96))] p-4 shadow-[-24px_0_60px_-42px_rgba(71,85,105,0.48)] ring-1 ring-white/70 backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full lg:hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Dialog.Title className="text-lg font-semibold tracking-tight text-foreground">
                  Operator menu
                </Dialog.Title>
                <Dialog.Description className="text-sm leading-6 text-muted-foreground">
                  Move between operator workflows without keeping the full nav pinned in the header.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Close workspace menu">
                  <X />
                </Button>
              </Dialog.Close>
            </div>

            {profileEmail || studioName ? (
              <div className="mt-5 rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(242,246,255,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {studioName ? <p className="text-sm font-semibold text-foreground">{studioName}</p> : null}
                {studioLocation ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{studioLocation}</p> : null}
                {profileEmail ? <p className="mt-3 text-sm text-muted-foreground">{profileEmail}</p> : null}
              </div>
            ) : null}

            <div className="mt-6 space-y-2">
              {links.map((link) => {
                const isActive = link.match(pathname);
                const Icon = link.icon;

                return (
                  <Dialog.Close asChild key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block rounded-[24px] border px-4 py-3 transition-all duration-150",
                        isActive
                          ? "border-primary/15 bg-[linear-gradient(180deg,rgba(109,82,255,0.08),rgba(83,193,255,0.08))] text-foreground shadow-[0_16px_32px_-28px_rgba(109,82,255,0.55)]"
                          : "border-transparent bg-white/56 text-muted-foreground hover:border-border/80 hover:bg-white/78 hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-current">
                        <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                        {link.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{link.detail}</span>
                    </Link>
                  </Dialog.Close>
                );
              })}
            </div>

            {showLegacyLink ? (
              <>
                <Separator className="my-5" />
                <Dialog.Close asChild>
                  <Link
                    href="/settings/legacy"
                    className="rounded-[24px] border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/35"
                  >
                    Legacy settings
                  </Link>
                </Dialog.Close>
              </>
            ) : null}

            <div className="mt-auto pt-5">
              <form action={signOutAction}>
                <Button type="submit" variant="destructive" className="w-full">
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <nav className="grid gap-2">
      {links.map((link) => {
        const isActive = link.match(pathname);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-2xl border px-4 py-3 transition-all duration-150",
              "hover:border-border/80 hover:bg-white/72 hover:text-foreground",
              isActive
                ? "border-primary/15 bg-[linear-gradient(180deg,rgba(109,82,255,0.08),rgba(83,193,255,0.08))] text-foreground shadow-[0_16px_32px_-28px_rgba(109,82,255,0.55)]"
                : "border-transparent text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-current">
              <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {link.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{link.detail}</span>
          </Link>
        );
      })}
    </nav>
  );
}
