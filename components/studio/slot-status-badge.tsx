import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SlotStatusBadgeProps = {
  status: string;
  className?: string;
};

const toneByStatus: Record<string, string> = {
  open: "border-cyan-200 bg-cyan-50 text-cyan-700",
  paid: "border-sky-200 bg-sky-50 text-sky-700",
  filled: "border-slate-200 bg-slate-50 text-slate-600",
  locked: "border-violet-200 bg-violet-50 text-violet-700",
  expired: "border-slate-200 bg-slate-50 text-slate-600",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  canceled: "border-rose-200 bg-rose-50 text-rose-700",
  refunded: "border-slate-200 bg-slate-50 text-slate-600",
};

export function SlotStatusBadge({ status, className }: SlotStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        toneByStatus[status] ?? "border-slate-200 bg-slate-50 text-slate-600",
        className
      )}
    >
      {status}
    </Badge>
  );
}
