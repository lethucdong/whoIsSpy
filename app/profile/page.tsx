"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Shuffle, Sparkles } from "lucide-react";
import { TopBar, Screen } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { usePlayer } from "@/lib/use-player";
import { AVATARS, randomName } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

export default function ProfilePage() {
  const { player, update } = usePlayer();
  const [name, setName] = useState("");

  // Đồng bộ tên khi danh tính người chơi tải xong (lần đầu)
  useEffect(() => {
    if (player) setName((prev) => (prev === "" ? player.name : prev));
  }, [player]);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      toast.error("Tên không được để trống");
      return;
    }
    update({ name: trimmed.slice(0, 20) });
    toast.success("Đã lưu hồ sơ!");
  };

  return (
    <>
      <TopBar title="Hồ sơ của bạn" subtitle="Tùy chỉnh tên & ảnh đại diện" />
      <Screen>
        {/* Xem trước */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong mb-6 flex flex-col items-center rounded-3xl p-6"
        >
          <Avatar emoji={player?.avatar ?? "🦊"} size="xl" ring />
          <p className="mt-3 text-xl font-extrabold">{name || player?.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Sparkles className="h-3 w-3" /> Sẵn sàng săn gián điệp
          </p>
        </motion.div>

        {/* Tên */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-muted">
              Tên hiển thị
            </label>
            <button
              onClick={() => setName(randomName())}
              className="flex items-center gap-1 text-xs text-primary-soft"
            >
              <Shuffle className="h-3 w-3" /> Ngẫu nhiên
            </button>
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Nhập tên của bạn"
          />
          <p className="mt-1 text-right text-xs text-faint">{name.length}/20</p>
        </div>

        {/* Chọn avatar */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Ảnh đại diện
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => update({ avatar: a })}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition active:scale-90 ${
                  player?.avatar === a
                    ? "bg-primary/20 ring-2 ring-primary"
                    : "bg-card-soft/40"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </Screen>

      <div className="safe-bottom sticky bottom-0 px-4 pb-2 pt-4">
        <Button size="lg" className="w-full" onClick={save}>
          <Check className="h-5 w-5" /> Lưu hồ sơ
        </Button>
      </div>
    </>
  );
}
