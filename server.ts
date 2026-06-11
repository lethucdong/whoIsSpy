// Custom server: Next.js + Socket.io, chia sẻ engine TypeScript trong bộ nhớ.
// Chạy bằng: tsx server.ts  (xem package.json)

import { createServer } from "node:http";
import next from "next";
import { Server as SocketServer, Socket } from "socket.io";
import { engine } from "./lib/socket/engine";
import { SOCKET_EVENTS as EV } from "./lib/socket/events";
import { generateRoomCode } from "./lib/utils";
import type { RoomSettings } from "./lib/types";

const dev = !process.argv.includes("--prod") && process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface PlayerInput {
  id: string;
  name: string;
  avatar: string;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new SocketServer(httpServer, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });

  // Phát trạng thái CÁ NHÂN HÓA cho từng người trong phòng
  // (mỗi người chỉ thấy vai trò/từ khóa của chính mình).
  async function emitState(code: string) {
    const room = `room:${code.toUpperCase()}`;
    const sockets = await io.in(room).fetchSockets();
    for (const s of sockets) {
      const viewerId = (s.data as { playerId?: string }).playerId;
      if (!viewerId) continue;
      const state = engine.getStateFor(code, viewerId);
      if (state) s.emit(EV.ROOM_STATE, state);
    }
  }

  // Engine gọi lại khi timer/phase thay đổi (không qua hành động người dùng).
  engine.setBroadcast((code) => {
    void emitState(code);
  });

  io.on("connection", (socket: Socket) => {
    const join = (code: string, player: PlayerInput) => {
      socket.data.playerId = player.id;
      socket.data.roomCode = code.toUpperCase();
      socket.join(`room:${code.toUpperCase()}`);
    };

    socket.on(EV.ROOM_CREATE, (payload: { player: PlayerInput; settings?: Partial<RoomSettings> }, cb?: (r: any) => void) => {
      let code = generateRoomCode();
      while (engine.hasRoom(code)) code = generateRoomCode();
      engine.createRoom(code, payload.player, payload.settings);
      join(code, payload.player);
      cb?.({ ok: true, code });
      emitState(code);
    });

    socket.on(EV.ROOM_JOIN, (payload: { code: string; player: PlayerInput }, cb?: (r: any) => void) => {
      const res = engine.joinRoom(payload.code, payload.player);
      if (!res.ok) {
        cb?.({ ok: false, error: res.error });
        socket.emit(EV.ERROR, res.error);
        return;
      }
      join(payload.code, payload.player);
      cb?.({ ok: true, code: payload.code.toUpperCase() });
      emitState(payload.code);
    });

    const withRoom = (fn: (code: string, playerId: string) => void) => () => {
      const code = socket.data.roomCode as string;
      const playerId = socket.data.playerId as string;
      if (code && playerId) fn(code, playerId);
    };

    socket.on(EV.PLAYER_READY, (ready: boolean) => {
      const { roomCode, playerId } = socket.data;
      if (roomCode) {
        engine.toggleReady(roomCode, playerId, ready);
        emitState(roomCode);
      }
    });

    socket.on(EV.ROOM_UPDATE_SETTINGS, (settings: Partial<RoomSettings>) => {
      const { roomCode, playerId } = socket.data;
      if (roomCode) {
        engine.updateSettings(roomCode, playerId, settings);
        emitState(roomCode);
      }
    });

    socket.on(EV.GAME_START, withRoom((code, pid) => {
      const res = engine.startGame(code, pid);
      if (!res.ok) socket.emit(EV.ERROR, res.error);
    }));

    socket.on(EV.CARD_REVEAL, withRoom((code, pid) => engine.revealCard(code, pid)));
    socket.on(EV.FORCE_DISCUSS, withRoom((code, pid) => engine.forceDiscuss(code, pid)));
    socket.on(EV.NEXT_SPEAKER, withRoom((code, pid) => engine.nextSpeaker(code, pid)));
    socket.on(EV.SKIP_TO_VOTE, withRoom((code, pid) => engine.skipToVote(code, pid)));
    socket.on(EV.NEXT_ROUND, withRoom((code, pid) => engine.nextRound(code, pid)));
    socket.on(EV.RESET_LOBBY, withRoom((code, pid) => engine.resetToLobby(code, pid)));

    socket.on(EV.VOTE_CAST, (targetId: string) => {
      const { roomCode, playerId } = socket.data;
      if (roomCode) engine.castVote(roomCode, playerId, targetId);
    });

    socket.on(EV.ROOM_LEAVE, () => {
      const { roomCode, playerId } = socket.data;
      if (roomCode) {
        engine.leaveRoom(roomCode, playerId);
        socket.leave(`room:${roomCode}`);
        emitState(roomCode);
      }
    });

    socket.on("disconnect", () => {
      const { roomCode, playerId } = socket.data;
      if (roomCode && playerId) {
        engine.setConnected(roomCode, playerId, false);
        emitState(roomCode);
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`\n  ▶ AI Là Gián Điệp? sẵn sàng tại http://localhost:${port}\n`);
  });
});
