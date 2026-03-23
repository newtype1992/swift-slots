import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,255,0.92))] p-6 shadow-[0_22px_46px_-32px_rgba(71,85,105,0.38)] ring-1 ring-white/70 backdrop-blur-sm",
        "flex flex-col gap-5 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {(actions || meta) ? (
        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-72 md:items-end">
          {meta ? <div className="flex flex-wrap gap-2 md:justify-end">{meta}</div> : null}
          {actions ? <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
