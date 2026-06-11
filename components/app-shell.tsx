"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  back?: boolean;
  right?: React.ReactNode;
}

export function TopBar({ title, subtitle, onBack, back = true, right }: TopBarProps) {
  const router = useRouter();
  return (
    <header className="safe-top sticky top-0 z-30 flex items-center gap-3 px-4 pb-3 pt-2 backdrop-blur-md">
      {back && (
        <button
          onClick={onBack ?? (() => router.back())}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-text transition active:scale-90"
          aria-label="Quay lại"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <h1 className="truncate text-lg font-bold leading-tight text-text">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="truncate text-xs text-muted">{subtitle}</p>
        )}
      </div>
      {right}
    </header>
  );
}

export function Screen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex flex-1 flex-col px-4 pb-6", className)}>
      {children}
    </main>
  );
}
