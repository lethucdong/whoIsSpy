"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Share2,
  Crown,
  Check,
  Loader2,
  Play,
  Users,
  UserRoundX,
  Eye,
  Clock,
  WifiOff,
  Settings2,
} from "lucide-react";
import { TopBar, Screen } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShareSheet } from "@/components/game/share-sheet";
import { useRoom } from "@/lib/use-room";
import { CATEGORIES } from "@/lib/keywords/data";

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { room, me, isHost, connected, actions } = useRoom(code?.toUpperCase());

  // Khi trận bắt đầu, chuyển sang màn chơi
  useEffect(() => {
    if (room && room.phase !== "LOBBY") {
      router.replace(`/game/${code?.toUpperCase()}`);
    }
  }, [room?.phase, code, router]);

  if (!room) {
    return (
      <Screen className="items-center justify-center gap-3">
        {connected ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary-soft" />
            <p className="text-muted">Đang vào phòng {code}...</p>
          </>
        ) : (
          <>
            <WifiOff className="h-8 w-8 text-muted" />
            <p className="text-muted">Đang kết nối máy chủ...</p>
          </>
        )}
      </Screen>
    );
  }

  const s = room.settings;
  const playerCount = room.players.length;
  const readyCount = room.players.filter((p) => p.isHost || p.ready).length;
  const canStart = playerCount >= 3 && readyCount === playerCount;
  const catLabel =
    s.category === "ALL"
      ? "Tất cả chủ đề"
      : CATEGORIES.find((c) => c.id === s.category)?.label ?? "Tất cả";

  return (
    <>
      <TopBar
        title="Phòng chờ"
        subtitle={`${playerCount}/${s.maxPlayers} người chơi`}
        onBack={() => {
          actions.leave();
          router.push("/");
        }}
        right={
          <ShareSheet
            code={room.code}
            trigger={
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-soft active:scale-90">
                <Share2 className="h-5 w-5" />
              </button>
            }
          />
        }
      />

      <Screen>
        {/* Mã phòng */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong mb-4 flex items-center justify-between rounded-2xl p-4"
        >
          <div>
            <p className="text-xs text-muted">Mã phòng</p>
            <p className="text-3xl font-extrabold tracking-[0.25em] text-gradient">
              {room.code}
            </p>
          </div>
          <ShareSheet
            code={room.code}
            trigger={
              <Button variant="glass" size="sm">
                <Share2 className="h-4 w-4" /> Mời bạn
              </Button>
            }
          />
        </motion.div>

        {/* Thiết lập hiện tại */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          <Stat icon={Users} value={`${s.maxPlayers}`} label="Tối đa" />
          <Stat icon={UserRoundX} value={`${s.spyCount}`} label="Gián điệp" />
          <Stat icon={Eye} value={`${s.blindCount}`} label="Người mù" />
          <Stat icon={Clock} value={`${s.discussSeconds}s`} label="Thảo luận" />
        </div>
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-card-soft/30 px-3 py-2 text-xs text-muted">
          <Settings2 className="h-3.5 w-3.5 shrink-0 text-primary-soft" />
          Chủ đề: <b className="text-text">{catLabel}</b>
          <span className="text-faint">•</span>
          Độ khó:{" "}
          <b className="text-text">
            {s.difficulty === "ALL"
              ? "Ngẫu nhiên"
              : s.difficulty === "EASY"
              ? "Dễ"
              : s.difficulty === "MEDIUM"
              ? "Vừa"
              : "Khó"}
          </b>
        </div>

        {/* Danh sách người chơi */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Người chơi
          </h2>
          <Badge variant={canStart ? "success" : "muted"}>
            {readyCount}/{playerCount} sẵn sàng
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <AnimatePresence>
            {room.players.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass flex items-center gap-3 rounded-2xl p-3"
              >
                <Avatar
                  emoji={p.avatar}
                  size="md"
                  dim={!p.connected}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-bold">{p.name}</p>
                    {p.id === me?.id && (
                      <span className="text-xs text-faint">(bạn)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {p.isHost ? (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Crown className="h-3 w-3" /> Chủ phòng
                      </span>
                    ) : p.ready ? (
                      <span className="text-green-400">Đã sẵn sàng</span>
                    ) : (
                      <span className="text-faint">Đang chờ...</span>
                    )}
                    {!p.connected && (
                      <span className="text-red-400">• mất kết nối</span>
                    )}
                  </div>
                </div>
                {p.isHost ? (
                  <Crown className="h-5 w-5 text-amber-400" />
                ) : p.ready ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success/20">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full border-2 border-dashed border-border" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {playerCount < 3 && (
          <p className="mt-4 text-center text-xs text-amber-400">
            Cần thêm {3 - playerCount} người nữa để bắt đầu (tối thiểu 3 người)
          </p>
        )}
      </Screen>

      {/* Thanh hành động dưới đáy */}
      <div className="safe-bottom sticky bottom-0 z-20 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-2 pt-4">
        {isHost ? (
          <Button
            size="lg"
            className="w-full"
            disabled={!canStart}
            onClick={actions.start}
          >
            <Play className="h-5 w-5" />
            {canStart
              ? "Bắt đầu trận đấu"
              : playerCount < 3
              ? "Chờ đủ người chơi"
              : "Chờ mọi người sẵn sàng"}
          </Button>
        ) : (
          <Button
            size="lg"
            variant={me?.ready ? "glass" : "success"}
            className="w-full"
            onClick={() => actions.setReady(!me?.ready)}
          >
            {me?.ready ? "Hủy sẵn sàng" : "Tôi đã sẵn sàng"}
          </Button>
        )}
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="glass flex flex-col items-center gap-0.5 rounded-2xl py-3">
      <Icon className="h-4 w-4 text-primary-soft" />
      <span className="text-lg font-extrabold leading-none">{value}</span>
      <span className="text-[10px] text-faint">{label}</span>
    </div>
  );
}
