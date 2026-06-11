"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (t: Toast) => void;
let listeners: Listener[] = [];
let counter = 0;

export const toast = {
  show(message: string, type: ToastType = "info") {
    const t = { id: ++counter, message, type };
    listeners.forEach((l) => l(t));
  },
  success(m: string) {
    this.show(m, "success");
  },
  error(m: string) {
    this.show(m, "error");
  },
  info(m: string) {
    this.show(m, "info");
  },
};

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-green-400" />,
  error: <AlertTriangle className="h-5 w-5 text-red-400" />,
  info: <Info className="h-5 w-5 text-info" />,
};

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    const listener: Listener = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3200);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] mx-auto flex max-w-md flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-strong pointer-events-auto flex w-full items-center gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-card)]"
          >
            {ICONS[t.type]}
            <span className="flex-1 text-sm font-medium text-text">
              {t.message}
            </span>
            <button
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              className="text-faint hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
