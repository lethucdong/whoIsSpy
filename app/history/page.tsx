"use client";

import { motion } from "framer-motion";
import { Trophy, Skull, Trash2, History as HistoryIcon, Crosshair } from "lucide-react";
import { TopBar, Screen } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/lib/use-history";
import { ROLE_LABEL } from "@/lib/types";

export default function HistoryPage() {
  const { history, clear, stats } = useHistory();
  const winRate = stats.total ? Math.round((stats.wins / stats.total) * 100) : 0;

  return (
    <>
      <TopBar
        title="Lịch sử & thống kê"
        subtitle={`${stats.total} trận đã chơi`}
        right={
          history.length > 0 ? (
            <button
              onClick={clear}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-faint active:scale-90"
              aria-label="Xóa lịch sử"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />
      <Screen>
        {/* Thống kê */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatCard value={`${stats.total}`} label="Trận" emoji="🎮" />
          <StatCard value={`${winRate}%`} label="Tỷ lệ thắng" emoji="🏆" />
          <StatCard value={`${stats.asSpy}`} label="Làm gián điệp" emoji="🕵️" />
        </div>

        {history.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <HistoryIcon className="h-12 w-12 text-faint" />
            <p className="mt-3 font-semibold text-muted">Chưa có trận nào</p>
            <p className="mt-1 text-sm text-faint">
              Chơi xong một ván là sẽ hiện ở đây
            </p>
            <Button asChild className="mt-5">
              <a href="/create-room">Tạo phòng chơi ngay</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass flex items-center gap-3 rounded-2xl p-3.5"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    h.won ? "bg-success/15" : "bg-danger/15"
                  }`}
                >
                  {h.won ? (
                    <Trophy className="h-5 w-5 text-green-400" />
                  ) : (
                    <Skull className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {h.won ? "Thắng" : "Thua"}
                    </span>
                    {h.myRole && (
                      <Badge
                        variant={h.myRole === "SPY" ? "danger" : "muted"}
                      >
                        {ROLE_LABEL[h.myRole]}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {h.civilianWord} vs {h.spyWord} • {h.players} người •{" "}
                    {h.rounds} vòng
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-faint">
                  {new Date(h.endedAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {stats.asSpy > 0 && (
          <div className="glass mt-5 flex items-center gap-3 rounded-2xl p-4">
            <Crosshair className="h-6 w-6 text-red-400" />
            <div className="text-sm">
              <p className="font-bold">Phong độ gián điệp</p>
              <p className="text-muted">
                Thắng {stats.spyWins}/{stats.asSpy} ván khi làm gián điệp
              </p>
            </div>
          </div>
        )}
      </Screen>
    </>
  );
}

function StatCard({
  value,
  label,
  emoji,
}: {
  value: string;
  label: string;
  emoji: string;
}) {
  return (
    <div className="glass flex flex-col items-center gap-0.5 rounded-2xl py-4">
      <span className="text-2xl">{emoji}</span>
      <span className="text-xl font-extrabold leading-none">{value}</span>
      <span className="text-[10px] text-faint">{label}</span>
    </div>
  );
}
