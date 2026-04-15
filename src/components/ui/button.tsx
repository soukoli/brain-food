import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-touch min-w-touch active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-text-inverse hover:bg-primary-hover shadow-card hover:shadow-card-hover",
        destructive: "bg-error text-text-inverse hover:bg-red-600 shadow-card",
        outline:
          "border border-border bg-surface hover:bg-background-secondary text-text-primary shadow-card",
        secondary:
          "bg-background-secondary text-text-primary hover:bg-slate-200 dark:hover:bg-slate-700",
        ghost: "hover:bg-background-secondary text-text-secondary hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-text-inverse hover:bg-green-600 shadow-card",
        warning: "bg-warning text-text-inverse hover:bg-orange-600 shadow-card",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-14 rounded-lg px-8 text-base font-semibold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
