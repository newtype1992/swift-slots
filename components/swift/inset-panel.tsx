import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type InsetPanelProps = {
  children: ReactNode;
  tone?: "default" | "primary";
  className?: string;
};

const toneClasses: Record<NonNullable<InsetPanelProps["tone"]>, string> = {
  default:
    "border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(242,246,255,0.72))] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  primary:
    "border-primary/12 bg-primary/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
};

export function InsetPanel({ children, tone = "default", className }: InsetPanelProps) {
  return (
    <div className={cn("rounded-2xl border p-4", toneClasses[tone], className)}>
      {children}
    </div>
  );
}
