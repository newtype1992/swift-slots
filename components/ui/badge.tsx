import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-primary/15 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:bg-primary/12",
        secondary:
          "border-secondary/65 bg-secondary/75 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] hover:bg-secondary/90",
        destructive:
          "border-destructive/15 bg-destructive/10 text-destructive focus-visible:ring-destructive/20 hover:bg-destructive/15",
        outline:
          "border-border/75 bg-white/72 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:bg-accent/80 hover:text-foreground",
        ghost:
          "bg-transparent shadow-none hover:bg-accent/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
