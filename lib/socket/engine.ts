// Engine trò chơi "AI Là Gián Điệp?" — quản lý phòng & vòng đấu trong bộ nhớ.
// Server giữ trạng thái chuẩn (authoritative) để tránh gian lận.

import {
  DEFAULT_SETTINGS,
  GamePhase,
  Role,
  RoomSettings,
  RoomState,
  PlayerState,
  SKIP_VOTE,
} from "@/lib/types";
import { pickRandomPair } from "@/lib/keywords";

interface InternalPlayer extends PlayerState {
  role: Role;
  word: string | null;
  hasRevealed: boolean;
}

interface InternalRoom {
  code: string;
  hostId: string;
  phase: GamePhase;
  round: number;
  settings: RoomSettings;
  players: InternalPlayer[];
  phaseEndsAt: number | null;
  currentSpeakerId: string | null;
  speakerOrder: string[];
  votes: Map<string, string>; // voterId -> targetId
  civilianWord: string;
  spyWord: string;
  category: string;
  difficulty: string;
  lastResult: RoomState["lastResult"];
  winInfo: RoomState["winInfo"];
  timer: NodeJS.Timeout | null;
}

type BroadcastFn = (code: string) => void;

export class GameEngine {
  private rooms = new Map<string, InternalRoom>();
  private broadcast: BroadcastFn = () => {};

  setBroadcast(fn: BroadcastFn) {
    this.broadcast = fn;
  }

  getRoom(code: string) {
    return this.rooms.get(code.toUpperCase());
  }

  hasRoom(code: string) {
    return this.rooms.has(code.toUpperCase());
  }

  // ----- Quản lý phòng -----

  createRoom(
    code: string,
    host: { id: string; name: string; avatar: string },
    settings?: Partial<RoomSettings>
  ): InternalRoom {
    const room: InternalRoom = {
      code: code.toUpperCase(),
      hostId: host.id,
      phase: "LOBBY",
      round: 0,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      players: [],
      phaseEndsAt: null,
      currentSpeakerId: null,
      speakerOrder: [],
      votes: new Map(),
      civilianWord: "",
      spyWord: "",
      category: "ALL",
      difficulty: "ALL",
      lastResult: null,
      winInfo: null,
      timer: null,
    };
    this.rooms.set(room.code, room);
    this.addPlayer(room, host, true);
    return room;
  }

  private addPlayer(
    room: InternalRoom,
    p: { id: string; name: string; avatar: string },
    isHost = false
  ) {
    room.players.push({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost,
      ready: isHost,
      connected: true,
      alive: true,
      role: "CIVILIAN",
      word: null,
      hasRevealed: false,
    });
  }

  joinRoom(
    code: string,
    p: { id: string; name: string; avatar: string }
  ): { ok: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { ok: false, error: "Không tìm thấy phòng này." };

    const existing = room.players.find((x) => x.id === p.id);
    if (existing) {
      existing.connected = true;
      existing.name = p.name;
      existing.avatar = p.avatar;
      return { ok: true };
    }

    if (room.phase !== "LOBBY")
      return { ok: false, error: "Trận đấu đã bắt đầu, không thể vào." };
    if (room.players.length >= room.settings.maxPlayers)
      return { ok: false, error: "Phòng đã đầy." };

    this.addPlayer(room, p);
    return { ok: true };
  }

  setConnected(code: string, playerId: string, connected: boolean) {
    const room = this.getRoom(code);
    const player = room?.players.find((p) => p.id === playerId);
    if (player) player.connected = connected;
  }

  leaveRoom(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      this.clearTimer(room);
      this.rooms.delete(room.code);
      return;
    }
    // Chuyển chủ phòng nếu chủ rời đi.
    if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
      room.players[0].ready = true;
    }
  }

  toggleReady(code: string, playerId: string, ready: boolean) {
    const room = this.getRoom(code);
    const player = room?.players.find((p) => p.id === playerId);
    if (player && !player.isHost) player.ready = ready;
  }

  updateSettings(code: string, playerId: string, settings: Partial<RoomSettings>) {
    const room = this.getRoom(code);
    if (!room || room.hostId !== playerId || room.phase !== "LOBBY") return;
    room.settings = { ...room.settings, ...settings };
    // Giới hạn hợp lệ
    const n = room.players.length;
    room.settings.spyCount = Math.min(
      Math.max(1, room.settings.spyCount),
      Math.max(1, Math.floor(n / 2))
    );
  }

  // ----- Vòng chơi -----

  canStart(room: InternalRoom): { ok: boolean; error?: string } {
    if (room.players.length < 3)
      return { ok: false, error: "Cần ít nhất 3 người chơi." };
    const allReady = room.players.every((p) => p.isHost || p.ready);
    if (!allReady) return { ok: false, error: "Chưa phải ai cũng sẵn sàng." };
    return { ok: true };
  }

  startGame(code: string, playerId: string): { ok: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { ok: false, error: "Phòng không tồn tại." };
    if (room.hostId !== playerId)
      return { ok: false, error: "Chỉ chủ phòng được bắt đầu." };
    const check = this.canStart(room);
    if (!check.ok) return check;

    const pair = pickRandomPair(room.settings.category, room.settings.difficulty);
    room.civilianWord = pair.civilian;
    room.spyWord = pair.spy;
    room.category = pair.category;
    room.difficulty = pair.difficulty;
    room.round = 1;
    room.winInfo = null;
    room.lastResult = null;

    this.assignRoles(room);
    this.enterReveal(room);
    return { ok: true };
  }

  private assignRoles(room: InternalRoom) {
    const players = room.players;
    const n = players.length;
    const spyCount = Math.min(room.settings.spyCount, Math.floor(n / 2) || 1);

    const indices = players.map((_, i) => i);
    // Trộn Fisher-Yates
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const spySet = new Set(indices.slice(0, spyCount));

    players.forEach((p, i) => {
      p.alive = true;
      p.hasRevealed = false;
      if (spySet.has(i)) {
        p.role = "SPY";
        p.word = room.spyWord;
      } else {
        p.role = "CIVILIAN";
        p.word = room.civilianWord;
      }
    });
  }

  private enterReveal(room: InternalRoom) {
    room.phase = "REVEAL";
    room.phaseEndsAt = null;
    room.votes.clear();
    room.players.forEach((p) => {
      if (p.alive) p.hasRevealed = false;
    });
    this.clearTimer(room);
    this.broadcast(room.code);
  }

  revealCard(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || room.phase !== "REVEAL") return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.alive) return;
    player.hasRevealed = true;

    const allRevealed = room.players
      .filter((p) => p.alive)
      .every((p) => p.hasRevealed);
    if (allRevealed) {
      this.enterDiscuss(room);
    } else {
      this.broadcast(room.code);
    }
  }

  forceDiscuss(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || room.hostId !== playerId || room.phase !== "REVEAL") return;
    this.enterDiscuss(room);
  }

  private enterDiscuss(room: InternalRoom) {
    room.phase = "DISCUSS";
    const alive = room.players.filter((p) => p.alive);
    room.speakerOrder = this.shuffle(alive.map((p) => p.id));
    room.currentSpeakerId = room.speakerOrder[0] ?? null;
    room.phaseEndsAt = Date.now() + room.settings.discussSeconds * 1000;
    this.scheduleTimer(room, () => this.enterVote(room));
    this.broadcast(room.code);
  }

  nextSpeaker(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || room.phase !== "DISCUSS") return;
    if (room.hostId !== playerId && room.currentSpeakerId !== playerId) return;
    const idx = room.speakerOrder.indexOf(room.currentSpeakerId ?? "");
    const next = room.speakerOrder[idx + 1];
    room.currentSpeakerId = next ?? null;
    this.broadcast(room.code);
  }

  skipToVote(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || room.hostId !== playerId || room.phase !== "DISCUSS") return;
    this.enterVote(room);
  }

  private enterVote(room: InternalRoom) {
    room.phase = "VOTE";
    room.votes.clear();
    room.currentSpeakerId = null;
    room.phaseEndsAt = Date.now() + room.settings.voteSeconds * 1000;
    this.scheduleTimer(room, () => this.tallyVotes(room));
    this.broadcast(room.code);
  }

  castVote(code: string, voterId: string, targetId: string) {
    const room = this.getRoom(code);
    if (!room || room.phase !== "VOTE") return;
    const voter = room.players.find((p) => p.id === voterId);
    const target = room.players.find((p) => p.id === targetId);
    if (!voter || !voter.alive || !target || !target.alive) return;
    this.recordVote(room, voterId, targetId);
  }

  // Người chơi chủ động chọn KHÔNG bỏ phiếu (bỏ qua) — vẫn tính là đã quyết
  // định để lượt vote có thể kết thúc, nhưng không cộng phiếu cho ai.
  skipVote(code: string, voterId: string) {
    const room = this.getRoom(code);
    if (!room || room.phase !== "VOTE") return;
    const voter = room.players.find((p) => p.id === voterId);
    if (!voter || !voter.alive) return;
    this.recordVote(room, voterId, SKIP_VOTE);
  }

  private recordVote(room: InternalRoom, voterId: string, targetId: string) {
    room.votes.set(voterId, targetId);
    const aliveCount = room.players.filter((p) => p.alive).length;
    if (room.votes.size >= aliveCount) {
      this.tallyVotes(room);
    } else {
      this.broadcast(room.code);
    }
  }

  private tallyVotes(room: InternalRoom) {
    this.clearTimer(room);
    const counts = new Map<string, number>();
    room.votes.forEach((targetId) => {
      if (targetId === SKIP_VOTE) return; // phiếu bỏ qua không tính cho ai
      counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
    });

    const tally = room.players
      .filter((p) => p.alive)
      .map((p) => ({
        targetId: p.id,
        targetName: p.name,
        count: counts.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);

    const top = tally[0];
    const tie =
      tally.length > 1 && tally[1].count === top.count && top.count > 0;
    const noVote = !top || top.count === 0;

    let eliminated: InternalPlayer | null = null;
    if (!tie && !noVote) {
      eliminated = room.players.find((p) => p.id === top.targetId) ?? null;
      if (eliminated) eliminated.alive = false;
    }

    room.lastResult = {
      round: room.round,
      eliminatedId: eliminated?.id ?? null,
      eliminatedName: eliminated?.name ?? null,
      eliminatedRole: eliminated?.role ?? null,
      votes: tally,
      tie: tie || noVote,
    };

    room.phase = "RESULT";
    room.phaseEndsAt = null;
    this.broadcast(room.code);

    // Kiểm tra điều kiện thắng — chờ vài giây để mọi người thấy ai bị loại
    // trước khi chuyển sang màn hình kết thúc.
    const win = this.checkWin(room);
    if (win) {
      room.timer = setTimeout(
        () => this.endGame(room, win.winner, win.reason),
        4500
      );
    }
  }

  private checkWin(
    room: InternalRoom
  ): { winner: "CIVILIAN" | "SPY"; reason: string } | null {
    const alive = room.players.filter((p) => p.alive);
    const spies = alive.filter((p) => p.role === "SPY");
    const others = alive.filter((p) => p.role !== "SPY");

    if (spies.length === 0)
      return {
        winner: "CIVILIAN",
        reason: "Tất cả gián điệp đã bị loại! Phe dân thường chiến thắng.",
      };

    // Gián điệp thắng khi số gián điệp >= số người còn lại không phải gián điệp.
    if (spies.length >= others.length)
      return {
        winner: "SPY",
        reason: "Gián điệp đã chiếm thế áp đảo! Phe gián điệp chiến thắng.",
      };

    return null;
  }

  nextRound(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || room.hostId !== playerId || room.phase !== "RESULT") return;
    if (this.checkWin(room)) return;
    // Từ khóa & vai trò không đổi giữa các vòng → vào thẳng thảo luận,
    // không bắt mọi người lật thẻ lại.
    room.round += 1;
    room.votes.clear();
    room.lastResult = null;
    this.enterDiscuss(room);
  }

  private endGame(
    room: InternalRoom,
    winner: "CIVILIAN" | "SPY",
    reason: string
  ) {
    room.phase = "ENDED";
    room.phaseEndsAt = null;
    room.winInfo = {
      winner,
      reason,
      civilianWord: room.civilianWord,
      spyWord: room.spyWord,
      reveals: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        word: p.word,
      })),
    };
    this.broadcast(room.code);
  }

  resetToLobby(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room || room.hostId !== playerId) return;
    this.clearTimer(room);
    room.phase = "LOBBY";
    room.round = 0;
    room.votes.clear();
    room.winInfo = null;
    room.lastResult = null;
    room.currentSpeakerId = null;
    room.phaseEndsAt = null;
    room.players.forEach((p) => {
      p.alive = true;
      p.hasRevealed = false;
      p.role = "CIVILIAN";
      p.word = null;
      p.ready = p.isHost;
    });
    this.broadcast(room.code);
  }

  // ----- Tiện ích -----

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private scheduleTimer(room: InternalRoom, fn: () => void) {
    this.clearTimer(room);
    const ms = Math.max(0, (room.phaseEndsAt ?? Date.now()) - Date.now());
    room.timer = setTimeout(fn, ms);
  }

  private clearTimer(room: InternalRoom) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
  }

  /**
   * Trạng thái cá nhân hóa:
   * - Từ khóa: chỉ chính người chơi đó thấy từ khóa của mình.
   * - Vai trò: KHÔNG AI biết vai trò trong lúc chơi — kể cả chủ phòng và
   *   của chính mình. Chỉ khi game KẾT THÚC mới lộ toàn bộ vai trò + từ khóa.
   */
  getStateFor(code: string, viewerId: string): RoomState | null {
    const room = this.getRoom(code);
    if (!room) return null;
    const ended = room.phase === "ENDED";

    const players: PlayerState[] = room.players.map((p) => {
      const isSelf = p.id === viewerId;
      const showWord = isSelf || ended;
      const showRole = ended;
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        ready: p.ready,
        connected: p.connected,
        alive: p.alive,
        role: showRole ? p.role : undefined,
        word: showWord ? p.word : undefined,
        hasRevealed: p.hasRevealed,
      };
    });

    return {
      code: room.code,
      hostId: room.hostId,
      phase: room.phase,
      round: room.round,
      settings: room.settings,
      players,
      phaseEndsAt: room.phaseEndsAt,
      currentSpeakerId: room.currentSpeakerId,
      votes: Array.from(room.votes.entries()).map(([voterId, targetId]) => ({
        voterId,
        targetId,
      })),
      lastResult: room.lastResult,
      winInfo: ended ? room.winInfo : null,
      category: room.category,
      difficulty: room.difficulty,
    };
  }
}

export const engine = new GameEngine();
