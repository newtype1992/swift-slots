import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,255,0.82))] px-6 py-8 text-center shadow-[0_20px_40px_-32px_rgba(71,85,105,0.34)]">
      <div className="mx-auto max-w-xl space-y-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="flex justify-center pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
