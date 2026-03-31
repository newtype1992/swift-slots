import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NoticeProps = {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "error";
  className?: string;
};

const toneClasses: Record<NonNullable<NoticeProps["tone"]>, string> = {
  info: "border-primary/12 bg-primary/8 text-primary",
  success: "border-emerald-200/80 bg-emerald-50/90 text-emerald-700",
  warning: "border-amber-200/80 bg-amber-50/90 text-amber-700",
  error: "border-rose-200/80 bg-rose-50/90 text-rose-700",
};

export function Notice({ children, tone = "info", className }: NoticeProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
