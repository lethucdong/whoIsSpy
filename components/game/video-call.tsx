"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertTriangle } from "lucide-react";
import { useWebRTC, RemotePeer } from "@/lib/use-webrtc";
import { RoomState } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Một ô video (local hoặc remote). Gắn MediaStream vào <video> qua ref. */
function VideoTile({
  stream,
  label,
  emoji,
  muted,
  speaking,
  camOff,
}: {
  stream: MediaStream | null;
  label: string;
  emoji?: string;
  muted?: boolean;
  speaking?: boolean;
  camOff?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && stream && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden rounded-xl bg-card-soft ring-1 ring-border",
        speaking && "ring-2 ring-primary"
      )}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={cn(
          "h-full w-full object-cover",
          (camOff || !stream) && "opacity-0"
        )}
      />
      {(camOff || !stream) && (
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          {emoji ?? "🙂"}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
        <span className="truncate text-[11px] font-semibold text-white">
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Lớp phủ cuộc gọi video nhóm. Tự xin quyền cam/mic khi `active=true`,
 * hiển thị lưới video + nút điều khiển.
 */
export function VideoCall({
  active,
  onClose,
  room,
  meName,
  meAvatar,
}: {
  active: boolean;
  onClose: () => void;
  room: RoomState;
  meName: string;
  meAvatar: string;
}) {
  const { localStream, peers, micOn, camOn, error, toggleMic, toggleCam } =
    useWebRTC(active);

  // Tra tên/avatar theo playerId của peer.
  const nameOf = (p: RemotePeer) => {
    const pl = room.players.find((x) => x.id === p.playerId);
    return { name: pl?.name ?? "Người chơi", avatar: pl?.avatar ?? "🙂" };
  };

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="glass-strong fixed left-3 right-20 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 max-h-[60dvh] overflow-hidden rounded-3xl p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-bold">
              Gọi nhóm · {peers.length + 1} người
            </h3>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl bg-danger/15 px-3 py-3 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : (
            <div className="grid max-h-[40dvh] grid-cols-3 gap-2 overflow-y-auto pb-1">
              <VideoTile
                stream={localStream}
                label={`${meName} (bạn)`}
                emoji={meAvatar}
                muted
                camOff={!camOn}
              />
              {peers.map((p) => {
                const info = nameOf(p);
                return (
                  <VideoTile
                    key={p.id}
                    stream={p.stream}
                    label={info.name}
                    emoji={info.avatar}
                  />
                );
              })}
            </div>
          )}

          {/* Điều khiển */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              disabled={!localStream}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40",
                micOn ? "bg-card-soft text-text" : "bg-danger text-white"
              )}
              aria-label={micOn ? "Tắt mic" : "Bật mic"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white shadow-lg transition active:scale-90"
              aria-label="Rời cuộc gọi"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <button
              onClick={toggleCam}
              disabled={!localStream}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40",
                camOn ? "bg-card-soft text-text" : "bg-danger text-white"
              )}
              aria-label={camOn ? "Tắt camera" : "Bật camera"}
            >
              {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
