"use client";

import { useState } from "react";
import { MessageCircle, Video } from "lucide-react";
import { useChat } from "@/lib/use-chat";
import { RoomState } from "@/lib/types";
import { ChatPanel } from "./chat-panel";
import { VideoCall } from "./video-call";
import { cn } from "@/lib/utils";

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
  const { messages, unread, send } = useChat(chatOpen);

  return (
    <>
      {/* Nút nổi — nâng cao hơn thanh hành động, chừa cả vùng an toàn iOS */}
      <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 flex flex-col gap-3">
        <button
          onClick={() => setCallOn((v) => !v)}
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
        onClose={() => setCallOn(false)}
        room={room}
        meName={meName}
        meAvatar={meAvatar}
      />

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        meId={meId}
        onSend={send}
      />
    </>
  );
}
