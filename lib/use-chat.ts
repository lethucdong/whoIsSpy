"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "./socket-context";
import { SOCKET_EVENTS as EV } from "./socket/events";
import { ChatMessage } from "./types";

/**
 * Quản lý boxchat của phòng: nhận lịch sử khi vào, lắng nghe tin mới, gửi tin.
 * `open` cho biết panel chat đang mở hay không để đếm tin chưa đọc.
 */
export function useChat(open: boolean) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!socket) return;

    const onHistory = (history: ChatMessage[]) => {
      setMessages(history ?? []);
    };
    const onNew = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (!openRef.current) setUnread((n) => n + 1);
    };

    socket.on(EV.CHAT_HISTORY, onHistory);
    socket.on(EV.CHAT_NEW, onNew);
    return () => {
      socket.off(EV.CHAT_HISTORY, onHistory);
      socket.off(EV.CHAT_NEW, onNew);
    };
  }, [socket]);

  // Khi mở panel thì coi như đã đọc hết.
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const send = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || !socket) return;
      socket.emit(EV.CHAT_SEND, { text: clean });
    },
    [socket]
  );

  return { messages, unread, send };
}
