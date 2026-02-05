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
          "bg-background text-foreground hover:text-orange-500 hover:bg-orange-50/50 border-none shadow-none",
        destructive:
          "bg-background text-destructive hover:bg-destructive/10 border-none shadow-none",
        outline:
          "bg-background text-foreground hover:text-orange-500 hover:bg-orange-50/50 border-none shadow-none",
        secondary:
          "bg-background text-foreground border-[1.5px] border-foreground shadow-sm hover:bg-orange-500 hover:border-orange-500 hover:text-white",
        ghost: "hover:bg-orange-50/50 hover:text-orange-500 transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
        linear: 
          "bg-background text-foreground hover:text-orange-500 hover:bg-orange-50/50 border-none shadow-none",
        linearPrimary:
          "bg-background text-foreground hover:text-orange-500 hover:bg-orange-50/50 border-none shadow-none",
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
