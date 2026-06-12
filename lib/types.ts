// Kiểu dữ liệu dùng chung giữa client & socket server.

export type Role = "CIVILIAN" | "SPY";

// Giá trị đặc biệt cho lá phiếu "không bỏ phiếu" (bỏ qua / abstain).
export const SKIP_VOTE = "__SKIP__";

export type GamePhase =
  | "LOBBY"
  | "REVEAL"
  | "DISCUSS"
  | "VOTE"
  | "RESULT"
  | "ENDED";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface PlayerIdentity {
  id: string;
  name: string;
  avatar: string;
}

export interface RoomSettings {
  maxPlayers: number;
  spyCount: number;
  discussSeconds: number;
  voteSeconds: number;
  category: string; // "ALL" hoặc tên danh mục
  difficulty: Difficulty | "ALL";
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  alive: boolean;
  // Chỉ gửi riêng cho từng người chơi:
  role?: Role;
  word?: string | null;
  hasRevealed?: boolean;
}

export interface VoteState {
  voterId: string;
  targetId: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  avatar: string;
  text: string;
  ts: number; // epoch ms
}

export interface RoundResult {
  round: number;
  eliminatedId: string | null;
  eliminatedName: string | null;
  eliminatedRole: Role | null;
  votes: { targetId: string; targetName: string; count: number }[];
  tie: boolean;
}

export interface GameWinInfo {
  winner: "CIVILIAN" | "SPY" | null;
  reason: string;
  civilianWord: string;
  spyWord: string;
  reveals: { id: string; name: string; role: Role; word: string | null }[];
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: GamePhase;
  round: number;
  settings: RoomSettings;
  players: PlayerState[];
  // Pha hiện tại
  phaseEndsAt?: number | null; // epoch ms
  currentSpeakerId?: string | null;
  votes?: VoteState[];
  lastResult?: RoundResult | null;
  winInfo?: GameWinInfo | null;
  category?: string;
  difficulty?: string;
}

export const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  spyCount: 1,
  discussSeconds: 120,
  voteSeconds: 30,
  category: "ALL",
  difficulty: "ALL",
};

export const ROLE_LABEL: Record<Role, string> = {
  CIVILIAN: "Dân Thường",
  SPY: "Gián Điệp",
};
