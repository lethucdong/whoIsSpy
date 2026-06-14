# Deploy lên Railway (từ Git)

Hướng dẫn deploy app **AI Là Gián Điệp?** lên Railway. Sau khi xong sẽ có
domain `https://<app>.up.railway.app` — HTTPS sẵn → camera/mic chạy được
trên iPhone/Android mà không cần ngrok.

## 0. Yêu cầu

- Tài khoản GitHub (đã push project lên repo).
- Tài khoản Railway: https://railway.app (đăng nhập bằng GitHub).
- Có thẻ Visa (Railway free trial $5/tháng, đủ test; nếu vượt cần upgrade).

## 1. Tạo Project + kết nối GitHub

1. railway.app → **New Project** → **Deploy from GitHub repo**.
2. Lần đầu phải Authorize Railway truy cập GitHub → chọn repo `whoIsSpy`.
3. Railway sẽ clone repo và bắt đầu build lần đầu (sẽ fail vì thiếu DB +
   biến môi trường — bình thường, ta sẽ fix ở bước sau).

## 2. Thêm Postgres database

1. Trong project, bấm **+ New** → **Database** → **Add PostgreSQL**.
2. Đợi vài giây cho DB khởi tạo.
3. Railway tự tạo các biến `DATABASE_URL`, `PGHOST`, ... trong service Postgres.

## 3. Set biến môi trường cho app

Vào service app (không phải Postgres) → tab **Variables** → **+ New Variable**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `DIRECT_URL` | `${{Postgres.DATABASE_URL}}` |

Dấu `${{...}}` là **reference variable** — Railway tự thay bằng giá trị
thật của service Postgres. Gõ tay đúng cú pháp này, không paste chuỗi
connect thật.

> Không cần set `PORT` / `HOST` — Railway tự inject. `server.ts` đã đọc
> `process.env.PORT` và bind `0.0.0.0`.

## 4. Cấu hình Build & Start

Mặc định Railway dùng Nixpacks, đọc `package.json`:

- **Build command**: `yarn build` (đã chạy `prisma generate && next build`).
- **Start command**: `yarn start` (chạy `tsx server.ts --prod`).

### Auto-migrate DB khi deploy (recommend)

Mặc định build chỉ `prisma generate`, **không** đẩy schema lên DB. Lần đầu
deploy DB rỗng → query crash. Có 2 cách:

**Cách A — sửa script `build` trong `package.json`:**

```json
"build": "prisma generate && prisma db push --accept-data-loss && next build"
```

**Cách B — set Custom Build Command trên Railway:**

Service app → **Settings** → **Build Command**:

```
yarn prisma:generate && yarn prisma:push && yarn build
```

Đang dùng `prisma db push` cho nhanh (không cần migration file). Nếu sau
này muốn migration đàng hoàng:

```
yarn prisma:generate && npx prisma migrate deploy && yarn build
```

(cần có thư mục `prisma/migrations/` trong repo).

## 5. Generate public domain

1. Service app → **Settings** → **Networking** → **Generate Domain**.
2. Railway in ra URL `https://<random>.up.railway.app`.
3. (Tuỳ chọn) Add custom domain nếu có domain riêng.

Railway tự lo HTTPS + cert. WebSocket bật mặc định, không cần config.

## 6. Test trên mobile

- Mở URL trên iPhone Safari / Android Chrome.
- Vào phòng → Bật gọi video → **Cho phép** quyền camera/micro.
- Camera bật ngay (đèn xanh sáng), tile hiện preview.

Nếu vẫn lỗi:
- Kiểm tra **Deploy Logs** trên Railway xem app start chưa.
- Mở DevTools remote: iOS qua Safari Mac, Android qua `chrome://inspect`.

## 7. CI/CD tự động

Railway đã hook vào GitHub: mỗi lần push lên branch chính → tự deploy lại.
Để đổi branch deploy: Service → Settings → **Source** → Branch.

Nếu muốn preview env cho mỗi PR: Settings → **PR Environments** → bật.

---

## Việc cần làm sau khi deploy lần đầu

### Khoá CORS

`server.ts` đang để `cors: { origin: "*" }`. Production nên đổi sang domain
Railway:

```ts
const io = new SocketServer(httpServer, {
  cors: { origin: process.env.PUBLIC_URL || "*" },
  transports: ["websocket", "polling"],
});
```

Rồi add biến `PUBLIC_URL=https://<app>.up.railway.app` trên Railway.

### TURN server cho WebRTC

`lib/use-webrtc.ts` chỉ có STUN của Google. Trên mạng 4G CGNAT / NAT chặt,
mesh có thể không kết nối được → ô peer mãi đen.

Thêm TURN free tier (Metered, Twilio, ...):

```ts
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302"] },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];
```

### Đừng bật autoscale

`lib/socket/engine.ts` giữ state phòng **in-memory** → nhiều replica sẽ
chia phòng ra nhiều RAM khác nhau, người chơi không thấy nhau. Giữ
**1 replica** trên Railway. Muốn scale phải refactor sang Redis adapter
cho Socket.IO + state store ngoài.

---

## Troubleshoot nhanh

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| Build fail `prisma generate` | Thiếu `DATABASE_URL` trong Variables |
| App crash khi start | Quên reference `${{Postgres.DATABASE_URL}}` |
| 502 / không tải được trang | Service chưa Generate Domain |
| Socket không connect | Block `wss://` ở mạng công ty (hiếm) |
| Camera vẫn lỗi HTTPS | Đang truy cập qua HTTP custom domain chưa SSL |
| Peer connect không thấy nhau | Cần TURN server (xem trên) |
