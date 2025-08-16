import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
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
        // New status variants with specific colors
        "new-order": "border-transparent bg-[#A8E6A3] text-green-800",
        "pending-reuse": "border-transparent bg-[#FFE58A] text-yellow-800",
        "pending-cod": "border-transparent bg-[#FFB56B] text-orange-800",
        "pending-cod-payment": "border-transparent bg-[#FFD6A5] text-orange-800",
        "pending-reuse-payment": "border-transparent bg-[#FFE0B2] text-orange-800",
        "processing-cod": "border-transparent bg-[#4A90E2] text-white",
        "processing-reuse": "border-transparent bg-[#8ECFFF] text-blue-800",
        "processing-depot": "border-transparent bg-[#C3A3F5] text-purple-800",
        "completed": "border-transparent bg-[#4CAF50] text-white",
        "declined-cod": "border-transparent bg-[#E74C3C] text-white",
        "declined-reuse": "border-transparent bg-[#FF8A80] text-red-800",
      },
      size: {
        default: "px-2 py-0.5 text-body-small",
        sm: "px-1.5 py-0.25 text-xs",
        lg: "px-2.5 py-0.75 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }