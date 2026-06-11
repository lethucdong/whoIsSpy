# AI Là Gián Điệp? — Tài liệu sản phẩm & kỹ thuật

Tài liệu này tổng hợp 18 đầu mục output theo yêu cầu.

---

## 1. Product Specification

**Tên:** AI Là Gián Điệp? — game suy luận xã hội multiplayer.
**Đối tượng:** học sinh, sinh viên, nhóm bạn, gia đình, cộng đồng Discord người Việt, ưu tiên người dùng điện thoại.
**Giá trị cốt lõi:** vào chơi trong 10 giây, mobile-first, tiếng Việt tự nhiên, thao tác tối giản.

**Vòng đời một ván:**
1. Chủ phòng tạo phòng & thiết lập luật → nhận mã 5 ký tự + link mời.
2. Người chơi vào bằng mã/link → bấm sẵn sàng.
3. Chủ phòng bắt đầu → hệ thống chia vai & từ khóa bí mật.
4. Mỗi người **lật thẻ** xem từ khóa của mình.
5. **Thảo luận** theo lượt (đếm ngược).
6. **Bỏ phiếu** loại người khả nghi.
7. **Kết quả** vòng → kiểm tra điều kiện thắng → chơi tiếp hoặc kết thúc.

**Vai trò:** Dân Thường (từ chính) · Gián Điệp (từ khác nhưng liên quan).

**Điều kiện thắng:** Dân thắng khi loại hết gián điệp; Gián điệp thắng khi số gián điệp còn sống ≥ số người còn lại không phải gián điệp.

---

## 2. User Flow

```
Trang chủ
 ├─ [Tạo Phòng] → /create-room → (thiết lập) → /room/[code] ──┐
 └─ [Vào Phòng] → /join-room → (nhập mã)  → /room/[code] ─────┤
                                                              ▼
                                  Phòng chờ (realtime, sẵn sàng)
                                                              │ host bấm Bắt đầu
                                                              ▼
        /game/[id]:  REVEAL → DISCUSS → VOTE → RESULT ──(còn gián điệp & cân bằng)──┐
                        ▲                                   │                        │
                        └──────── vòng tiếp theo ───────────┘                        │
                                                            │ đạt điều kiện thắng    │
                                                            ▼                        │
                                                          ENDED ──[Chơi lại]→ LOBBY ─┘
                                                                └──[Trang chủ]→ /
```

Link mời: `/join-room?code=ABCDE` (tự điền mã, auto-join khi đủ 5 ký tự).

---

## 3. Information Architecture

```
/                 Trang chủ (hero, tính năng, cách chơi, chế độ, FAQ)
/create-room      Thiết lập & tạo phòng
/join-room        Nhập mã / mở từ link mời
/room/[code]      Phòng chờ (lobby realtime)
/game/[id]        Trận đấu (REVEAL/DISCUSS/VOTE/RESULT/ENDED)
/history          Lịch sử & thống kê (localStorage)
/profile          Tên + avatar người chơi (localStorage)
```

Danh tính người chơi lưu ở `localStorage` (không cần đăng nhập → vào chơi nhanh).

---

## 4. Prisma Schema

Xem [`prisma/schema.prisma`](../prisma/schema.prisma). Tóm tắt model:
`User, Room, RoomPlayer, Game, Round, Vote, KeywordPair, PlayerRole, GameEvent` — tất cả dùng UUID, có index trên khóa ngoại, mã phòng, phase, thời gian, role...

---

## 5. Database ERD

```
User 1──* RoomPlayer *──1 Room 1──* Game 1──* Round 1──* Vote
  │                         │            │                 │
  │                         │            └──* PlayerRole   ├─ voter  → User
  └── host ────────────────┘            └──* GameEvent     └─ target → User
                                Game *──1 KeywordPair
```

- `User` ↔ `Room` (host) 1–n
- `Room` ↔ `RoomPlayer` ↔ `User` (n–n, unique [roomId,userId])
- `Game` ↔ `Round` ↔ `Vote` (unique [roundId,voterId])
- `Game` ↔ `PlayerRole` (unique [gameId,userId]), `Game` ↔ `KeywordPair`

---

## 6. Folder Structure

Xem [`README.md`](../README.md#-cấu-trúc-thư-mục).

---

## 7. Route Structure

| Route | Render | Mô tả |
|---|---|---|
| `/` | static | Trang chủ |
| `/create-room` | static (client) | Thiết lập phòng |
| `/join-room` | static (client) | Nhập mã (Suspense cho `useSearchParams`) |
| `/room/[code]` | dynamic | Phòng chờ realtime |
| `/game/[id]` | dynamic | Trận đấu realtime |
| `/history`, `/profile` | static (client) | Dữ liệu cục bộ |

---

## 8. Server Actions

Trò chơi realtime dùng **Socket.io** (độ trễ thấp) thay cho Server Actions cho vòng chơi. Server Actions/route handlers dành cho tác vụ không-realtime khi bật DB:

- `persistGameResult(game)` — lưu `Game/Round/Vote/PlayerRole/GameEvent`.
- `upsertUserStats(userId)` — cập nhật `gamesPlayed/Won/spyGames/spyWins`.
- `seedKeywords()` — nạp `KeywordPair` (xem `prisma/seed.ts`).

Validate bằng **Zod** (schema settings: `maxPlayers 3–16`, `spyCount ≥1`, `discussSeconds 30–300`, `voteSeconds 15–120`).

---

## 9. Socket Events

Client → Server: `room:create`, `room:join`, `room:leave`, `player:ready`,
`room:updateSettings`, `game:start`, `card:reveal`, `game:forceDiscuss`,
`game:nextSpeaker`, `game:skipToVote`, `vote:cast`, `game:nextRound`, `game:resetLobby`.

Server → Client: `room:state` (trạng thái **cá nhân hóa** — chỉ lộ vai trò/từ khóa của chính người nhận), `game:error`.

Nguồn chuẩn: [`lib/socket/events.ts`](../lib/socket/events.ts) · Engine: [`lib/socket/engine.ts`](../lib/socket/engine.ts).

---

## 10. Component Hierarchy

```
RootLayout (SocketProvider, Toaster, khung max-w-md)
├─ HomePage
├─ CreateRoomPage → Stepper, Avatar, Button
├─ JoinRoomPage   → ô nhập mã 5 ký tự
├─ RoomPage       → TopBar, ShareSheet(Dialog), PlayerList, Stat
└─ GamePage
   ├─ RevealPhase → RoleCard (flip)
   ├─ DiscussPhase→ PhaseTimer, PlayerRoster
   ├─ VotePhase   → PhaseTimer, PlayerRoster(selectable)
   ├─ ResultPhase → vote bars
   └─ EndedPhase  → reveal toàn bộ vai trò
```

---

## 11. UI Design System

- **Màu:** bg `#0F172A`, card `#1E293B`, primary `#6366F1`, success `#22C55E`, danger `#EF4444`, text `#F8FAFC`.
- **Phong cách:** Dark mode + Glassmorphism (`.glass`, `.glass-strong`), aurora background, dot-grid.
- **Typography:** Be Vietnam Pro (Google Fonts), cỡ lớn, tap target ≥ 44px.
- **Tokens:** khai báo qua `@theme` trong [`app/globals.css`](../app/globals.css) (Tailwind v4).
- **Component:** Button (5 variant), Card, Input, Stepper, Switch, Badge, Avatar, Dialog (bottom-sheet), Tabs, Toaster.

---

## 12. Wireframes (low-fi)

```
HOME            CREATE              ROOM/LOBBY          GAME/REVEAL
┌──────────┐    ┌──────────┐        ┌──────────┐        ┌──────────┐
│   🕵️     │    │ ‹ Tạo P. │        │‹ Phòng  ⤴│        │ Vòng 1   │
│ AI LÀ    │    │ [host]   │        │  ABCDE   │        │ Xem từ   │
│ GIÁN ĐIỆP│    │ Người [8]│        │ ▢▢▢▢ stat│        │ ┌──────┐ │
│ [Tạo P.] │    │ Spy [1]  │        │ • P1 host│        │ │ 🃏   │ │
│ [Vào P.] │    │ Time ... │        │ • P2  ✓  │        │ │ chạm │ │
│ tính năng│    │ chủ đề   │        │ • P3 ...│        │ └──────┘ │
│ cách chơi│    │ ─────────│        │ ─────────│        │ ──────── │
│ FAQ      │    │[Tạo phòng]│       │[Bắt đầu] │        │[Thảo luận]│
└──────────┘    └──────────┘        └──────────┘        └──────────┘
```

---

## 13. Mobile Screens

Toàn bộ giao diện thiết kế **mobile-first** trong khung `max-w-md`, có `safe-area`
inset cho tai thỏ/thanh điều hướng iOS, nút hành động cố định đáy màn (sticky),
ô nhập mã dạng OTP, bottom-sheet chia sẻ, vòng đếm ngược tròn, lưới người chơi 3 cột.

## 14. Desktop Screens

Khung căn giữa `max-w-md` giữ trải nghiệm như app điện thoại trên desktop (giống
nhiều game di động), nền aurora phủ toàn màn. Có thể mở rộng grid ở breakpoint `md:`
cho lobby/sảnh nếu cần — kiến trúc component đã tách sẵn.

---

## 15. Animation Specs (Framer Motion)

| Nơi | Hiệu ứng |
|---|---|
| Lật thẻ | `rotateY 0→180`, 0.7s ease, mặt sau từ khóa `scale + blur→0` (delay 0.35s, spring) |
| Trang chủ | hero float, stagger các card khi vào viewport |
| Toast | spring trượt từ trên xuống |
| Roster | `layout` animate, tap `scale 0.94` |
| Kết quả | người bị loại `rotateY 90→0` spring; thanh phiếu `width 0→%` |
| Thắng | emoji `scale + rotate` spring, lộ diện vai trò |
| Timer | vòng tròn `stroke-dashoffset` 0.3s linear, đỏ + pulse khi ≤ 10s |

---

## 16. MVP Roadmap

1. ✅ Khung dự án, design system, danh tính cục bộ.
2. ✅ Socket engine in-memory + realtime lobby.
3. ✅ Luồng chơi đầy đủ: reveal → discuss → vote → result → ended.
4. ✅ Bộ từ khóa 18 danh mục, lật thẻ, chia sẻ, lịch sử/hồ sơ.
5. ✅ Mobile-first UI/UX hoàn chỉnh + build pass.

## 17. Production Roadmap

- Persist DB (Neon) cho lịch sử/thống kê toàn cục, bảng xếp hạng.
- Tài khoản (OAuth) tùy chọn, đồng bộ đa thiết bị.
- Reconnect mượt (khôi phục vào lại ván đang chơi), chống mất kết nối.
- Mở rộng bộ từ lên 1000+ cặp, kiểm duyệt cộng đồng, chế độ tùy biến từ khóa.
- Chat trong phòng, emoji reactions, âm thanh.
- Chống gian lận, rate-limit, phòng riêng tư/công khai, ghép phòng nhanh.
- i18n, PWA cài đặt được, thông báo đẩy.

## 18. Triển khai Vercel + Neon

**Lưu ý realtime:** Socket.io cần kết nối WebSocket lâu dài → chạy `server.ts`
(Next + Socket.io) trên nền hỗ trợ long-running (Railway / Render / Fly.io / VPS).

**Phương án khuyến nghị:**
1. **Next.js (UI)** → Vercel.
2. **Socket server** (`server.ts`) → Railway/Render; trỏ client tới URL socket qua biến môi trường.
3. **Neon PostgreSQL** → tạo project, copy `DATABASE_URL` vào cả hai môi trường.

```bash
# Neon
npm run prisma:push && npm run db:seed
# Socket server (Railway/Render)
npm run build && npm start         # tsx server.ts --prod
# Vercel: import repo, set env DATABASE_URL + NEXT_PUBLIC_SOCKET_URL
```

> Bản hiện tại đóng gói UI + socket trong **một** custom server (`npm start`), có thể
> deploy trọn gói lên một nền long-running duy nhất là chơi được ngay.
