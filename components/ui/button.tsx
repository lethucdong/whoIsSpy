"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-base font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-primary-soft to-primary text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.7)] hover:brightness-110",
        success:
          "bg-gradient-to-b from-green-400 to-success text-white shadow-[0_8px_24px_-8px_rgba(34,197,94,0.6)] hover:brightness-110",
        danger:
          "bg-gradient-to-b from-red-400 to-danger text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.6)] hover:brightness-110",
        glass:
          "glass text-text hover:bg-white/5",
        outline:
          "border border-border bg-transparent text-text hover:bg-white/5",
        ghost: "bg-transparent text-muted hover:bg-white/5 hover:text-text",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-5",
        lg: "h-14 px-6 text-lg",
        icon: "h-12 w-12",
        pill: "h-11 px-4 rounded-full text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
