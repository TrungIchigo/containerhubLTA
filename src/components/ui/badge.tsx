import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-body-small font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-dark",
        secondary: "border-transparent bg-foreground text-text-primary border-border hover:bg-gray-50",
        destructive: "border-transparent bg-danger text-white hover:bg-red-600",
        accent: "border-transparent bg-accent text-accent-foreground hover:bg-accent-dark",
        outline: "border-border bg-foreground text-text-primary hover:bg-gray-50",
        pending: "border-transparent bg-accent-light text-accent-foreground",
        approved: "border-transparent bg-primary-light text-primary",
        declined: "border-transparent bg-red-100 text-danger",
        confirmed: "border-transparent bg-primary-light text-primary",
        info: "border-transparent bg-blue-100 text-info",
        warning: "border-transparent bg-orange-100 text-orange-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 