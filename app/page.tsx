"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Plus,
  LogIn,
  Eye,
  Users,
  Zap,
  ShieldQuestion,
  ChevronDown,
  Clock,
  History,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KEYWORD_COUNT } from "@/lib/keywords/data";

const FEATURES = [
  { icon: Zap, title: "Vào chơi trong 10 giây", desc: "Tạo phòng, gửi link, chơi ngay. Không cần tải app." },
  { icon: Users, title: "3–16 người chơi", desc: "Hợp với hội bạn, lớp học, gia đình hay server Discord." },
  { icon: Eye, title: "Vai trò bí ẩn", desc: "Dân thường, gián điệp và cả người mù phải đoán mò." },
  { icon: ShieldQuestion, title: `${KEYWORD_COUNT}+ cặp từ khóa`, desc: "Đồ ăn, địa danh, người nổi tiếng, meme... thuần Việt." },
];

const HOW_TO = [
  { n: 1, t: "Mỗi người nhận một từ khóa bí mật", d: "Dân thường cùng một từ, gián điệp nhận từ khác nhưng có liên quan." },
  { n: 2, t: "Lần lượt mô tả từ của mình", d: "Nói khéo để đồng đội hiểu nhưng đừng để lộ cho gián điệp." },
  { n: 3, t: "Bỏ phiếu loại kẻ khả nghi", d: "Sau mỗi vòng thảo luận, cả phòng vote người bị nghi là gián điệp." },
  { n: 4, t: "Tìm ra gián điệp để thắng", d: "Dân thắng khi loại hết gián điệp. Gián điệp thắng nếu trụ tới cuối." },
];

const MODES = [
  { emoji: "🎯", t: "Cổ điển", d: "1 gián điệp ẩn mình giữa đám đông." },
  { emoji: "👥", t: "Đa gián điệp", d: "Nhiều gián điệp bắt tay nhau lật kèo." },
  { emoji: "⚡", t: "Tốc chiến", d: "Thời gian ngắn, quyết định nhanh." },
];

const FAQ = [
  { q: "Có cần tải ứng dụng không?", a: "Không. Chơi trực tiếp trên trình duyệt điện thoại hoặc máy tính." },
  { q: "Tối thiểu mấy người chơi được?", a: "Từ 3 người trở lên. Đông hơn sẽ càng vui và khó đoán." },
  { q: "Gián điệp khác dân thường thế nào?", a: "Gián điệp nhận một từ khóa khác nhưng có liên quan, nên phải mô tả thật mượt để không bị lộ." },
];

export default function HomePage() {
  return (
    <div className="dot-grid flex flex-1 flex-col">
      {/* HERO */}
      <section className="safe-top relative flex flex-col items-center px-5 pt-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary-soft" />
          Game suy luận realtime cho hội bạn
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="relative mb-4"
        >
          <div className="animate-[float_6s_ease-in-out_infinite] text-7xl drop-shadow-[0_8px_30px_rgba(99,102,241,0.5)]">
            🕵️
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl font-extrabold leading-tight tracking-tight"
        >
          AI LÀ <span className="text-gradient">GIÁN ĐIỆP?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-3 max-w-xs text-pretty text-base text-muted"
        >
          Bạn có tìm ra gián điệp trước khi quá muộn?
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex w-full flex-col gap-3"
        >
          <Button asChild size="lg" className="animate-pulse-glow w-full">
            <Link href="/create-room">
              <Plus className="h-5 w-5" /> Tạo Phòng
            </Link>
          </Button>
          <Button asChild size="lg" variant="glass" className="w-full">
            <Link href="/join-room">
              <LogIn className="h-5 w-5" /> Vào Phòng
            </Link>
          </Button>
        </motion.div>

        <div className="mt-4 flex items-center gap-4 text-xs text-faint">
          <Link href="/history" className="flex items-center gap-1 hover:text-muted">
            <History className="h-3.5 w-3.5" /> Lịch sử
          </Link>
          <span className="h-3 w-px bg-border" />
          <Link href="/profile" className="flex items-center gap-1 hover:text-muted">
            <UserRound className="h-3.5 w-3.5" /> Hồ sơ
          </Link>
        </div>
      </section>

      {/* TÍNH NĂNG */}
      <section className="mt-12 px-4">
        <SectionTitle icon={Zap} label="Tính năng" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4"
            >
              <f.icon className="mb-2 h-6 w-6 text-primary-soft" />
              <h3 className="text-sm font-bold leading-tight">{f.title}</h3>
              <p className="mt-1 text-xs leading-snug text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CÁCH CHƠI */}
      <section className="mt-12 px-4">
        <SectionTitle icon={Eye} label="Cách chơi" />
        <div className="mt-4 space-y-3">
          {HOW_TO.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass flex gap-3 rounded-2xl p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {s.n}
              </div>
              <div>
                <h3 className="text-sm font-bold">{s.t}</h3>
                <p className="mt-0.5 text-xs leading-snug text-muted">{s.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CHẾ ĐỘ CHƠI */}
      <section className="mt-12 px-4">
        <SectionTitle icon={Clock} label="Chế độ chơi" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {MODES.map((m) => (
            <div key={m.t} className="glass rounded-2xl p-4">
              <div className="text-3xl">{m.emoji}</div>
              <h3 className="mt-2 text-sm font-bold">{m.t}</h3>
              <p className="mt-0.5 text-xs leading-snug text-muted">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12 px-4">
        <SectionTitle icon={ShieldQuestion} label="Câu hỏi thường gặp" />
        <div className="mt-4 space-y-2">
          {FAQ.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="mt-14 px-4">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 text-center">
          <div className="absolute -right-6 -top-6 text-8xl opacity-10">🕵️</div>
          <h3 className="text-xl font-extrabold">Tụ tập là chiến thôi!</h3>
          <p className="mt-1 text-sm text-muted">Mời cả hội vào tìm gián điệp nào.</p>
          <Button asChild size="lg" className="mt-4 w-full">
            <Link href="/create-room">
              <Plus className="h-5 w-5" /> Tạo Phòng Ngay
            </Link>
          </Button>
        </div>
      </section>

      <footer className="safe-bottom mt-10 px-4 text-center text-xs text-faint">
        Made with 💜 for người chơi Việt Nam
      </footer>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
        <Icon className="h-4 w-4 text-primary-soft" />
      </div>
      <h2 className="text-base font-bold uppercase tracking-wide text-text">
        {label}
      </h2>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="glass w-full rounded-2xl p-4 text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pt-2 text-xs leading-relaxed text-muted">{a}</p>
      </motion.div>
    </button>
  );
}
