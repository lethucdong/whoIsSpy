"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Bảng chat trượt lên từ đáy để người chơi thảo luận. */
export function ChatPanel({
  open,
  onClose,
  messages,
  meId,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  meId: string;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuộn xuống cuối khi có tin mới hoặc khi mở.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    onSend(clean);
    setText("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="glass-strong fixed inset-x-0 bottom-0 z-50 flex h-[70dvh] flex-col rounded-t-3xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-bold">💬 Thảo luận</h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card-soft text-muted active:scale-90"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={listRef}
              className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
            >
              {messages.length === 0 ? (
                <p className="mt-8 text-center text-sm text-faint">
                  Chưa có tin nhắn nào. Hãy bắt đầu thảo luận!
                </p>
              ) : (
                messages.map((m) => {
                  const mine = m.playerId === meId;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-end gap-2",
                        mine && "flex-row-reverse"
                      )}
                    >
                      <span className="mb-1 text-lg leading-none">
                        {m.avatar}
                      </span>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2",
                          mine
                            ? "rounded-br-sm bg-primary text-white"
                            : "rounded-bl-sm bg-card-soft text-text"
                        )}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[11px] font-semibold text-primary-soft">
                            {m.name}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {m.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="safe-bottom flex items-center gap-2 border-t border-border px-3 py-2.5">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                maxLength={500}
                placeholder="Nhập tin nhắn..."
                className="h-11 flex-1 rounded-full border border-border bg-card/60 px-4 text-sm outline-none placeholder:text-faint focus:border-primary/60"
              />
              <button
                onClick={submit}
                disabled={!text.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition active:scale-90 disabled:opacity-40"
                aria-label="Gửi"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
