"use client";

import { useRef, useState } from "react";
import { MessageCircle, Video } from "lucide-react";
import { useChat } from "@/lib/use-chat";
import { RoomState } from "@/lib/types";
import { ChatPanel } from "./chat-panel";
import { VideoCall } from "./video-call";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Bộ điều khiển giao tiếp nổi trên màn chơi: chat box + gọi video nhóm.
 * Hai nút tròn ở góc phải; chat có chấm đếm tin chưa đọc.
 */
export function CommsDock({
  room,
  meId,
  meName,
  meAvatar,
}: {
  room: RoomState;
  meId: string;
  meName: string;
  meAvatar: string;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [callOn, setCallOn] = useState(false);
  const [permDialog, setPermDialog] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  // Stream được giữ sống sau khi xin quyền; truyền vào useWebRTC để tránh
  // gọi getUserMedia lần 2 bên ngoài user-gesture (lỗi NotAllowedError iOS).
  const grantedStreamRef = useRef<MediaStream | null>(null);
  const [grantedStream, setGrantedStream] = useState<MediaStream | null>(null);
  const { messages, unread, send } = useChat(chatOpen);

  // Gọi getUserMedia ngay trong click handler (iOS Safari yêu cầu user gesture).
  // Stream được GIỮ SỐNG và truyền thẳng vào useWebRTC — không xin lại lần 2.
  async function confirmStartCall() {
    setPermError(null);
    setStarting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      grantedStreamRef.current = s;
      setGrantedStream(s);
      setPermDialog(false);
      setCallOn(true);
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setPermError(
          typeof window !== "undefined" && location.protocol !== "https:"
            ? "Cần HTTPS để dùng camera/micro. Hãy truy cập qua https://."
            : "Quyền bị từ chối. Trên iPhone: Cài đặt → Safari → Camera & Micrô → Cho phép, rồi tải lại trang."
        );
      } else if (e.name === "NotFoundError") {
        setPermError("Không tìm thấy camera hoặc micro trên thiết bị.");
      } else if (e.name === "NotReadableError") {
        setPermError("Camera/micro đang được ứng dụng khác sử dụng.");
      } else {
        setPermError("Không truy cập được camera/micro. Hãy thử lại.");
      }
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      {/* Nút nổi — nâng cao hơn thanh hành động, chừa cả vùng an toàn iOS */}
      <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 flex flex-col gap-3">
        <button
          onClick={() => {
            if (!callOn) setPermDialog(true);
            else {
              setCallOn(false);
              // Stream sẽ bị stop bởi useWebRTC cleanup; xóa ref local.
              grantedStreamRef.current = null;
              setGrantedStream(null);
            }
          }}
          className={cn(
            "relative flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition active:scale-90",
            callOn
              ? "bg-danger text-white"
              : "bg-card-soft text-primary-soft ring-1 ring-border"
          )}
          aria-label="Gọi video nhóm"
        >
          <Video className="h-6 w-6" />
        </button>

        <button
          onClick={() => setChatOpen(true)}
          className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-card-soft text-primary-soft shadow-lg ring-1 ring-border transition active:scale-90"
          aria-label="Mở chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>

      <VideoCall
        active={callOn}
        onClose={() => {
          setCallOn(false);
          grantedStreamRef.current = null;
          setGrantedStream(null);
        }}
        room={room}
        meName={meName}
        meAvatar={meAvatar}
        initialStream={grantedStream}
      />

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        meId={meId}
        onSend={send}
      />

      <Dialog
        open={permDialog}
        onOpenChange={(v) => {
          if (!v) { setPermDialog(false); setPermError(null); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bật gọi video nhóm?</DialogTitle>
            <DialogDescription>
              App cần truy cập <strong>camera</strong> và <strong>micro</strong> để kết
              nối với người chơi khác. Trình duyệt sẽ hiện yêu cầu cấp phép — hãy
              chọn <em>Cho phép</em> để tiếp tục.
            </DialogDescription>
          </DialogHeader>

          {permError && (
            <p className="mt-3 rounded-xl bg-danger/15 px-3 py-2.5 text-sm text-red-400">
              {permError}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => { setPermDialog(false); setPermError(null); }}
              disabled={starting}
              className="flex-1 rounded-2xl bg-card-soft py-3 text-sm font-semibold text-text transition active:scale-95 disabled:opacity-40"
            >
              Huỷ
            </button>
            <button
              onClick={confirmStartCall}
              disabled={starting}
              className="flex-1 rounded-2xl bg-primary py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
            >
              {starting ? "Đang kết nối…" : permError ? "Thử lại" : "Bật gọi video"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
