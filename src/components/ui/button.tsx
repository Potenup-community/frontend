import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_1px_2px_0_rgba(0,0,0,0.1)] hover:bg-primary/90 border border-primary/10",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 border border-destructive/10",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 border border-secondary/10",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Linear Style Special Variants
        linear: 
          "bg-gradient-to-b from-white to-gray-50 text-slate-900 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.5)_inset] hover:bg-gray-50 hover:border-gray-300 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100 dark:border-slate-700 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]",
        linearPrimary:
          "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border border-indigo-600 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.15)_inset] hover:from-indigo-500 hover:to-indigo-600 hover:shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.2)_inset]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
