# 🕵️ AI Là Gián Điệp?

Phiên bản web multiplayer hiện đại của trò chơi suy luận "Ai Là Gián Điệp" — **mobile-first**, giao diện tiếng Việt, vào chơi trong 10 giây.

> Bạn có tìm ra gián điệp trước khi quá muộn?

## ✨ Tính năng

- 🎮 Tạo phòng, vào phòng bằng mã 5 ký tự, chia sẻ link mời
- ⚡ Realtime với **Socket.io** — danh sách người chơi, thảo luận, bỏ phiếu cập nhật tức thì
- 🃏 Màn **lật thẻ** với hiệu ứng flip / blur / glow / scale
- 🎭 2 vai trò: **Dân Thường**, **Gián Điệp**
- ⚙️ Tùy chỉnh số người, số gián điệp, thời gian, chủ đề, độ khó
- 📚 Hơn 200 cặp từ khóa tiếng Việt qua 18 danh mục, 3 mức độ khó
- 📊 Lịch sử & thống kê cá nhân
- 🌙 Dark mode + Glassmorphism (phong cách Discord / Spotify / Linear)

## 🧱 Tech Stack

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Style | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Realtime | Socket.io (custom Node server) |
| DB (tùy chọn) | Prisma ORM + Neon PostgreSQL |
| Form/Validate | React Hook Form + Zod |
| Deploy | Vercel + Neon |

## 🚀 Chạy local

```bash
npm install
npm run dev          # custom server: Next.js + Socket.io tại http://localhost:3000
```

> Game chơi được **ngay** mà không cần database — engine vòng chơi chạy in-memory
> trên socket server. Database chỉ cần khi muốn lưu lịch sử/thống kê dài hạn.

### Bật database (tùy chọn)

```bash
cp .env.example .env          # điền DATABASE_URL từ Neon
npm run prisma:push           # tạo bảng
npm run db:seed               # nạp bộ từ khóa
```

### Smoke test luồng chơi

```bash
npm run dev                   # cửa sổ 1
node scripts/test-flow.mjs    # cửa sổ 2 — mô phỏng 4 người chơi 1 ván
```

## 📁 Cấu trúc thư mục

```
app/                      # App Router (mobile-first, tiếng Việt)
  page.tsx                # Trang chủ
  create-room/            # Tạo phòng
  join-room/              # Vào phòng (đọc ?code= từ link mời)
  room/[code]/            # Phòng chờ (realtime)
  game/[id]/              # Trận đấu: REVEAL → DISCUSS → VOTE → RESULT → ENDED
  history/ · profile/     # Lịch sử & Hồ sơ
components/
  ui/                     # shadcn-style primitives (tối ưu tap target)
  game/                   # role-card, phase-timer, player-roster, share-sheet
lib/
  socket/engine.ts        # Engine trò chơi (authoritative, in-memory)
  socket/events.ts        # Hằng số sự kiện Socket.io
  keywords/               # Bộ cặp từ khóa + lọc/random
  use-room.ts · use-player.ts · use-countdown.ts · use-history.ts
  socket-context.tsx · types.ts · utils.ts
prisma/schema.prisma      # Schema đầy đủ (UUID + index)
server.ts                 # Custom server: Next.js + Socket.io
docs/SPEC.md              # Product spec, IA, flows, socket events, roadmap...
```

## ☁️ Triển khai

Xem [`docs/SPEC.md`](docs/SPEC.md) phần *Kế hoạch triển khai* để biết chi tiết
deploy lên Vercel + Neon (lưu ý: realtime cần host hỗ trợ WebSocket lâu dài như
Railway/Render/Fly.io cho socket server; Vercel phù hợp cho phần Next.js).
