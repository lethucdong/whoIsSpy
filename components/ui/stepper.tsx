"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

/** Bộ tăng/giảm số lớn, dễ chạm trên điện thoại. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix,
  className,
}: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-2xl border border-border bg-card-soft/50 p-1.5",
        className
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-text transition active:scale-90 disabled:opacity-30"
        aria-label="Giảm"
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-baseline justify-center gap-1 tabular-nums">
        <span className="text-2xl font-extrabold text-text">{value}</span>
        {suffix && <span className="text-xs text-muted">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-soft transition active:scale-90 disabled:opacity-30"
        aria-label="Tăng"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
