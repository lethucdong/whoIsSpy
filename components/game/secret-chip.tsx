"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Role } from "@/lib/types";
import { CATEGORIES } from "@/lib/keywords/data";
import { cn } from "@/lib/utils";

/** Chip "nhìn trộm" từ khóa của chính mình — ẩn mặc định, chạm để xem 3 giây. */
export function SecretChip({
  role,
  word,
  category,
}: {
  /** Bỏ trống nếu người chơi không được biết vai trò (chỉ host mới biết). */
  role?: Role;
  word: string | null;
  category?: string;
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const peek = () => {
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 3000);
  };

  const emoji =
    role === "BLIND"
      ? "❓"
      : CATEGORIES.find((c) => c.id === category)?.emoji ?? "🗝️";
  const display = role === "BLIND" ? "???" : word ?? "???";
  const tone =
    role === "SPY"
      ? "border-danger/40 text-red-400"
      : role === "BLIND"
      ? "border-purple-500/40 text-purple-300"
      : "border-primary/40 text-primary-soft";

  return (
    <button
      onClick={peek}
      className={cn(
        "flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-xs font-semibold backdrop-blur transition active:scale-95",
        tone
      )}
    >
      {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      <span className="text-muted">Từ của bạn:</span>
      <span className="relative inline-flex min-w-[3rem] justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {show ? (
            <motion.span
              key="word"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1"
            >
              {emoji} {display}
            </motion.span>
          ) : (
            <motion.span
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tracking-widest"
            >
              • • • •
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
