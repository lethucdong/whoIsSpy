"use client";

import { formatTime } from "@/lib/utils";

interface PhaseTimerProps {
  remaining: number;
  total: number;
  label?: string;
}

/** Vòng đếm ngược tròn. */
export function PhaseTimer({ remaining, total, label }: PhaseTimerProps) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? remaining / total : 0;
  const offset = c * (1 - pct);
  const danger = remaining <= 10 && remaining > 0;

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={danger ? "#ef4444" : "#6366f1"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={`text-lg font-extrabold tabular-nums ${
            danger ? "animate-pulse text-red-400" : "text-text"
          }`}
        >
          {formatTime(remaining)}
        </span>
        {label && <span className="text-[9px] text-faint">{label}</span>}
      </div>
    </div>
  );
}
