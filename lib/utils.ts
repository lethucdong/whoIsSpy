import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sinh mã phòng 5 ký tự dễ đọc (bỏ các ký tự dễ nhầm). */
export function generateRoomCode(length = 5) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/** Định dạng giây thành mm:ss. */
export function formatTime(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const AVATARS = [
  "🦊", "🐼", "🐯", "🦁", "🐸", "🐵", "🐧", "🦉",
  "🐙", "🦄", "🐲", "👻", "🤖", "👽", "🦝", "🐺",
  "🐻", "🐨", "🐰", "🐹", "🦔", "🐢", "🦖", "🐳",
];

export function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export { AVATARS };

const FUNNY_NAMES = [
  "Thám Tử Lú", "Gián Điệp Ẩn", "Cao Thủ Bịa", "Trùm Cuối",
  "Người Bí Ẩn", "Mèo Máy", "Soái Ca", "Thánh Nói Dối",
  "Cụ Non", "Hổ Báo", "Cá Vàng", "Bún Đậu",
];

export function randomName() {
  return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
}
