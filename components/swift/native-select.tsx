import * as React from "react";
import { cn } from "@/lib/utils";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      data-slot="native-select"
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground",
        "outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

NativeSelect.displayName = "NativeSelect";
