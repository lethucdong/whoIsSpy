"use client";

import { motion } from "framer-motion";
import { Mic, Skull, Check, Crown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PlayerState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RosterProps {
  players: PlayerState[];
  speakerId?: string | null;
  selfId?: string;
  votedTargetId?: string | null; // hiển thị lựa chọn của mình
  voteCounts?: Record<string, number>;
  onSelect?: (id: string) => void;
  selectable?: boolean;
}

export function PlayerRoster({
  players,
  speakerId,
  selfId,
  votedTargetId,
  voteCounts,
  onSelect,
  selectable,
}: RosterProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {players.map((p) => {
        const isSpeaking = p.id === speakerId;
        const isVoted = p.id === votedTargetId;
        const count = voteCounts?.[p.id] ?? 0;
        const canPick = selectable && p.alive && p.id !== selfId;

        return (
          <motion.button
            key={p.id}
            layout
            disabled={!canPick}
            onClick={() => canPick && onSelect?.(p.id)}
            whileTap={canPick ? { scale: 0.94 } : undefined}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition",
              p.alive
                ? "border-border bg-card-soft/40"
                : "border-transparent bg-card-soft/20",
              isSpeaking && "border-primary bg-primary/10 ring-2 ring-primary/40",
              isVoted && "border-danger bg-danger/10 ring-2 ring-danger/40",
              canPick && "active:scale-95 cursor-pointer"
            )}
          >
            <div className="relative">
              <Avatar emoji={p.avatar} size="md" dim={!p.alive} ring={isSpeaking} />
              {!p.alive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skull className="h-5 w-5 text-red-400/80" />
                </div>
              )}
              {isSpeaking && p.alive && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Mic className="h-3 w-3" />
                </span>
              )}
              {isVoted && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>

            <span
              className={cn(
                "max-w-full truncate text-xs font-semibold",
                p.alive ? "text-text" : "text-faint line-through"
              )}
            >
              {p.name}
            </span>

            {p.isHost && (
              <Crown className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-amber-400" />
            )}
            {voteCounts && count > 0 && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                {count} phiếu
              </span>
            )}
            {p.id === selfId && (
              <span className="text-[9px] text-faint">(bạn)</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
