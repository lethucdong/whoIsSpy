"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Hand } from "lucide-react";
import { Role } from "@/lib/types";
import { CATEGORIES } from "@/lib/keywords/data";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  /** Bỏ trống nếu người chơi không được biết vai trò (chỉ host mới biết). */
  role?: Role;
  word: string | null;
  category?: string;
  onRevealed?: () => void;
}

type CardTheme = {
  glow: string;
  ring: string;
  chip: string;
  label: string;
  sub: string;
};

// Thẻ trung tính khi người chơi không được biết vai trò: chỉ hiện từ khóa.
const NEUTRAL_THEME: CardTheme = {
  glow: "shadow-[0_0_60px_-10px_rgba(99,102,241,0.7)]",
  ring: "ring-primary/50",
  chip: "bg-primary/20 text-primary-soft",
  label: "Từ khóa của bạn",
  sub: "Ghi nhớ & mô tả khi tới lượt — đừng để lộ!",
};

const ROLE_THEME: Record<Role, CardTheme> = {
  CIVILIAN: {
    glow: "shadow-[0_0_60px_-10px_rgba(99,102,241,0.7)]",
    ring: "ring-primary/50",
    chip: "bg-primary/20 text-primary-soft",
    label: "Dân Thường",
    sub: "Mô tả từ khóa để tìm ra gián điệp",
  },
  SPY: {
    glow: "shadow-[0_0_60px_-10px_rgba(239,68,68,0.7)]",
    ring: "ring-danger/50",
    chip: "bg-danger/20 text-red-400",
    label: "Gián Điệp",
    sub: "Hãy hòa nhập, đừng để lộ thân phận!",
  },
  BLIND: {
    glow: "shadow-[0_0_60px_-10px_rgba(168,85,247,0.7)]",
    ring: "ring-purple-500/50",
    chip: "bg-purple-500/20 text-purple-300",
    label: "Người Mù",
    sub: "Bạn không có từ khóa — hãy suy luận!",
  },
};

export function RoleCard({ role, word, category, onRevealed }: RoleCardProps) {
  const [flipped, setFlipped] = useState(false);
  const theme = role ? ROLE_THEME[role] : NEUTRAL_THEME;
  const emoji =
    role === "BLIND"
      ? "❓"
      : CATEGORIES.find((c) => c.id === category)?.emoji ?? "🗝️";
  const display = role === "BLIND" ? "???" : word ?? "???";

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    onRevealed?.();
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-[22rem] w-64 [perspective:1400px]"
        onClick={handleFlip}
        role="button"
        aria-label="Lật thẻ xem từ khóa"
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* MẶT TRƯỚC */}
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <div className="glass-strong flex h-full w-full flex-col items-center justify-center gap-5 rounded-[2rem] border-2 border-primary/30 shadow-[0_0_50px_-12px_rgba(99,102,241,0.6)]">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="text-7xl"
              >
                🃏
              </motion.div>
              <div className="text-center">
                <p className="flex items-center justify-center gap-2 text-lg font-bold text-text">
                  <Hand className="h-5 w-5" /> Chạm để xem
                </p>
                <p className="mt-1 text-sm text-muted">từ khóa bí mật của bạn</p>
              </div>
              <div className="absolute bottom-6 h-1 w-16 animate-pulse rounded-full bg-primary/60" />
            </div>
          </div>

          {/* MẶT SAU */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-4 rounded-[2rem] border-2 bg-card ring-2",
                theme.glow,
                theme.ring,
                role === "SPY"
                  ? "border-danger/40"
                  : role === "BLIND"
                  ? "border-purple-500/40"
                  : "border-primary/40"
              )}
            >
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  theme.chip
                )}
              >
                {theme.label}
              </span>

              <AnimatePresence>
                {flipped && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0, filter: "blur(12px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 16 }}
                    className="flex flex-col items-center gap-2 px-4 text-center"
                  >
                    <span className="text-6xl drop-shadow-lg">{emoji}</span>
                    <span className="text-3xl font-extrabold leading-tight text-text">
                      {display}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="absolute bottom-6 max-w-[14rem] px-4 text-center text-xs text-muted">
                {theme.sub}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {!flipped && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 flex items-center gap-1.5 text-sm text-faint"
        >
          <Eye className="h-4 w-4" /> Đừng cho người khác xem nhé!
        </motion.p>
      )}
    </div>
  );
}
