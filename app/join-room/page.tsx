"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Loader2 } from "lucide-react";
import { TopBar, Screen } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useSocket } from "@/lib/socket-context";
import { usePlayer } from "@/lib/use-player";
import { SOCKET_EVENTS as EV } from "@/lib/socket/events";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const LEN = 5;

function JoinInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { socket, connected } = useSocket();
  const { player } = usePlayer();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = params.get("code");
    if (q) setCode(q.toUpperCase().slice(0, LEN));
  }, [params]);

  const handleJoin = (value?: string) => {
    const c = (value ?? code).trim().toUpperCase();
    if (c.length < LEN) {
      toast.error(`Mã phòng gồm ${LEN} ký tự`);
      return;
    }
    if (!socket || !player) return;
    if (!connected) {
      toast.error("Đang kết nối máy chủ...");
      return;
    }
    setLoading(true);
    socket.emit(
      EV.ROOM_JOIN,
      { code: c, player },
      (res: { ok: boolean; code?: string; error?: string }) => {
        if (res?.ok && res.code) {
          router.push(`/room/${res.code}`);
        } else {
          setLoading(false);
          toast.error(res?.error || "Không vào được phòng");
        }
      }
    );
  };

  const chars = code.padEnd(LEN, " ").split("").slice(0, LEN);

  return (
    <>
      <TopBar title="Vào phòng" subtitle="Nhập mã phòng từ bạn bè" />
      <Screen className="items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-2 text-6xl"
        >
          🔑
        </motion.div>
        <p className="mb-6 max-w-xs text-center text-sm text-muted">
          Nhập mã 5 ký tự để tham gia phòng cùng cả hội
        </p>

        {/* Ô hiển thị mã — input trong suốt phủ toàn bộ để mobile focus đúng */}
        <div
          className="relative inline-flex gap-2 cursor-text"
          onClick={() => inputRef.current?.focus()}
          aria-label="Nhập mã phòng"
        >
          {chars.map((ch, i) => (
            <div
              key={i}
              className={cn(
                "pointer-events-none flex h-16 w-12 items-center justify-center rounded-2xl border-2 text-2xl font-extrabold tabular-nums transition",
                ch.trim()
                  ? "border-primary bg-primary/10 text-text"
                  : "border-border bg-card-soft/40 text-faint",
                i === code.length &&
                  "border-primary-soft ring-2 ring-primary/40"
              )}
            >
              {ch.trim() || ""}
            </div>
          ))}
          {/* Input phủ toàn bộ vùng ô mã — có kích thước thật để mobile hiện bàn phím */}
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => {
              const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, LEN);
              setCode(v);
              if (v.length === LEN) handleJoin(v);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            enterKeyHint="go"
            maxLength={LEN}
            className="absolute inset-0 h-full w-full cursor-text opacity-0"
            autoFocus
            aria-label="Mã phòng"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-faint">
          <Avatar emoji={player?.avatar ?? "🦊"} size="sm" />
          Vào với tên <b className="text-muted">{player?.name ?? "..."}</b>
        </div>
      </Screen>

      <div className="safe-bottom sticky bottom-0 px-4 pb-2 pt-4">
        <Button
          size="lg"
          className="w-full"
          onClick={() => handleJoin()}
          disabled={loading || code.length < LEN}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          Vào phòng
        </Button>
      </div>
    </>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Đang tải...</div>}>
      <JoinInner />
    </Suspense>
  );
}
