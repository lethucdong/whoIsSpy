"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, UserRoundX, MessagesSquare, Vote, Loader2, Rocket } from "lucide-react";
import { TopBar, Screen } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { Avatar } from "@/components/ui/avatar";
import { useSocket } from "@/lib/socket-context";
import { usePlayer } from "@/lib/use-player";
import { SOCKET_EVENTS as EV } from "@/lib/socket/events";
import { DEFAULT_SETTINGS, Difficulty, RoomSettings } from "@/lib/types";
import { CATEGORIES } from "@/lib/keywords/data";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const DIFFICULTIES: { id: Difficulty | "ALL"; label: string; emoji: string }[] = [
  { id: "ALL", label: "Tất cả", emoji: "🎲" },
  { id: "EASY", label: "Dễ", emoji: "🟢" },
  { id: "MEDIUM", label: "Vừa", emoji: "🟡" },
  { id: "HARD", label: "Khó", emoji: "🔴" },
];

export default function CreateRoomPage() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { player } = usePlayer();
  const [settings, setSettings] = useState<RoomSettings>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(false);

  const set = (patch: Partial<RoomSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const maxSpy = Math.max(1, Math.floor(settings.maxPlayers / 2));

  const handleCreate = () => {
    if (!socket || !player) return;
    if (!connected) {
      toast.error("Đang kết nối máy chủ, thử lại sau giây lát...");
      return;
    }
    setLoading(true);
    const safe: RoomSettings = {
      ...settings,
      spyCount: Math.min(settings.spyCount, maxSpy),
    };
    socket.emit(
      EV.ROOM_CREATE,
      { player, settings: safe },
      (res: { ok: boolean; code?: string; error?: string }) => {
        if (res?.ok && res.code) {
          router.push(`/room/${res.code}`);
        } else {
          setLoading(false);
          toast.error(res?.error || "Tạo phòng thất bại");
        }
      }
    );
  };

  return (
    <>
      <TopBar title="Tạo phòng mới" subtitle="Thiết lập luật chơi cho cả hội" />
      <Screen>
        {/* Chủ phòng */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mb-4 flex items-center gap-3 rounded-2xl p-3"
        >
          <Avatar emoji={player?.avatar ?? "🦊"} size="md" ring />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Chủ phòng</p>
            <p className="truncate font-bold">{player?.name ?? "..."}</p>
          </div>
          <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-amber-400">
            👑 HOST
          </span>
        </motion.div>

        <div className="space-y-4">
          {/* Số người chơi */}
          <Field icon={Users} label="Số người chơi tối đa">
            <Stepper
              value={settings.maxPlayers}
              onChange={(v) =>
                set({
                  maxPlayers: v,
                  spyCount: Math.min(settings.spyCount, Math.floor(v / 2) || 1),
                })
              }
              min={3}
              max={16}
              suffix="người"
            />
          </Field>

          {/* Gián điệp */}
          <Field icon={UserRoundX} label="Số gián điệp">
            <Stepper
              value={settings.spyCount}
              onChange={(v) => set({ spyCount: v })}
              min={1}
              max={maxSpy}
            />
          </Field>

          {/* Thời gian */}
          <div className="grid grid-cols-2 gap-3">
            <Field icon={MessagesSquare} label="Thảo luận">
              <Stepper
                value={settings.discussSeconds}
                onChange={(v) => set({ discussSeconds: v })}
                min={30}
                max={300}
                step={15}
                suffix="giây"
              />
            </Field>
            <Field icon={Vote} label="Bỏ phiếu">
              <Stepper
                value={settings.voteSeconds}
                onChange={(v) => set({ voteSeconds: v })}
                min={15}
                max={120}
                step={5}
                suffix="giây"
              />
            </Field>
          </div>

          {/* Độ khó */}
          <Field icon={Rocket} label="Độ khó từ khóa">
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => set({ difficulty: d.id })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-semibold transition active:scale-95",
                    settings.difficulty === d.id
                      ? "border-primary bg-primary/15 text-primary-soft"
                      : "border-border bg-card-soft/40 text-muted"
                  )}
                >
                  <span className="text-base">{d.emoji}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Danh mục */}
          <Field icon={MessagesSquare} label="Chủ đề từ khóa">
            <div className="flex flex-wrap gap-2">
              <CatChip
                active={settings.category === "ALL"}
                onClick={() => set({ category: "ALL" })}
              >
                🎲 Tất cả
              </CatChip>
              {CATEGORIES.map((c) => (
                <CatChip
                  key={c.id}
                  active={settings.category === c.id}
                  onClick={() => set({ category: c.id })}
                >
                  {c.emoji} {c.label}
                </CatChip>
              ))}
            </div>
          </Field>
        </div>

        {/* Tóm tắt luật thắng */}
        <div className="glass mt-5 rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            Điều kiện thắng
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            👮 <b className="text-text">Dân thường thắng</b> khi loại hết gián điệp.
            <br />
            🕵️ <b className="text-text">Gián điệp thắng</b> khi số gián điệp còn
            sống ≥ số người còn lại.
          </p>
        </div>
      </Screen>

      {/* Nút tạo phòng cố định dưới đáy */}
      <div className="safe-bottom sticky bottom-0 z-20 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-2 pt-4">
        <Button
          size="lg"
          className="w-full"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Rocket className="h-5 w-5" />
          )}
          {loading ? "Đang tạo phòng..." : "Tạo phòng & vào sảnh chờ"}
        </Button>
      </div>
    </>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-primary-soft" />
        <span className="text-sm font-semibold text-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95",
        active
          ? "border-primary bg-primary/15 text-primary-soft"
          : "border-border bg-card-soft/40 text-muted"
      )}
    >
      {children}
    </button>
  );
}
