import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  dim?: boolean;
  className?: string;
}

const SIZES = {
  sm: "h-9 w-9 text-lg",
  md: "h-12 w-12 text-2xl",
  lg: "h-16 w-16 text-3xl",
  xl: "h-24 w-24 text-5xl",
};

export function Avatar({
  emoji,
  size = "md",
  ring,
  dim,
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-card-soft to-card",
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-bg",
        dim && "opacity-40 grayscale",
        SIZES[size],
        className
      )}
    >
      <span className="leading-none">{emoji}</span>
    </div>
  );
}
