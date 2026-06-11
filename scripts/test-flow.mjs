import { io } from "socket.io-client";

const URL = "http://localhost:3000";
const EV = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  PLAYER_READY: "player:ready",
  GAME_START: "game:start",
  CARD_REVEAL: "card:reveal",
  FORCE_DISCUSS: "game:forceDiscuss",
  SKIP_TO_VOTE: "game:skipToVote",
  VOTE_CAST: "vote:cast",
  NEXT_ROUND: "game:nextRound",
  ROOM_STATE: "room:state",
  ERROR: "game:error",
};

const mkPlayer = (n) => ({ id: `p-${n}-${Math.random().toString(36).slice(2)}`, name: `P${n}`, avatar: "🦊" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const conn = () => io(URL, { transports: ["websocket"] });

function waitState(sock, pred, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout: " + label)), 6000);
    const h = (s) => {
      if (pred(s)) {
        clearTimeout(t);
        sock.off(EV.ROOM_STATE, h);
        resolve(s);
      }
    };
    sock.on(EV.ROOM_STATE, h);
  });
}

const states = {};
function track(sock, key) {
  sock.on(EV.ROOM_STATE, (s) => (states[key] = s));
  sock.on(EV.ERROR, (e) => console.log(`  ⚠ [${key}] error:`, e));
}

async function main() {
  const players = [mkPlayer(1), mkPlayer(2), mkPlayer(3), mkPlayer(4)];
  const socks = players.map(() => conn());
  socks.forEach((s, i) => track(s, i));
  await Promise.all(socks.map((s) => new Promise((r) => s.on("connect", r))));
  console.log("✓ 4 client kết nối");

  // Host tạo phòng
  const code = await new Promise((res) =>
    socks[0].emit(EV.ROOM_CREATE, { player: players[0] }, (r) => res(r.code))
  );
  console.log("✓ Tạo phòng:", code);

  // 3 người còn lại join
  for (let i = 1; i < 4; i++) {
    await new Promise((res) =>
      socks[i].emit(EV.ROOM_JOIN, { code, player: players[i] }, () => res())
    );
  }
  await waitState(socks[0], (s) => s.players.length === 4, "4 players");
  console.log("✓ 4 người trong phòng");

  // Ready
  for (let i = 1; i < 4; i++) socks[i].emit(EV.PLAYER_READY, true);
  await waitState(socks[0], (s) => s.players.every((p) => p.isHost || p.ready), "all ready");
  console.log("✓ Tất cả sẵn sàng");

  // Bắt snapshot REVEAL của riêng từng người (vai trò chỉ lộ cho chính họ)
  const caps = players.map(() => null);
  socks.forEach((s, i) =>
    s.on(EV.ROOM_STATE, (st) => {
      if (st.phase === "REVEAL") caps[i] = st;
    })
  );

  // Start
  socks[0].emit(EV.GAME_START);
  await waitState(socks[0], (s) => s.phase === "REVEAL", "reveal");
  await sleep(300);
  const myRoles = players.map(
    (p, i) => caps[i]?.players.find((x) => x.id === p.id)?.role
  );
  console.log("✓ Vào REVEAL. Vai trò:", myRoles.join(", "));
  const spyCount = myRoles.filter((r) => r === "SPY").length;
  console.log(`  → ${spyCount} gián điệp (mong đợi 1)`);

  // Tất cả lật thẻ
  socks.forEach((s) => s.emit(EV.CARD_REVEAL));
  await waitState(socks[0], (s) => s.phase === "DISCUSS", "discuss");
  console.log("✓ Auto chuyển sang DISCUSS (mọi người đã xem)");

  // Host bỏ qua sang vote
  socks[0].emit(EV.SKIP_TO_VOTE);
  await waitState(socks[0], (s) => s.phase === "VOTE", "vote");
  console.log("✓ Vào VOTE");

  // Mọi người vote cho người chơi index 3 (P4)
  const target = players[3].id;
  socks.forEach((s) => s.emit(EV.VOTE_CAST, target));
  await waitState(socks[0], (s) => s.phase === "RESULT" || s.phase === "ENDED", "result");
  const r = states[0].lastResult;
  console.log(`✓ Vào ${states[0].phase}. Bị loại: ${r?.eliminatedName} (${r?.eliminatedRole})`);
  if (states[0].phase === "ENDED") {
    console.log("✓ Trận kết thúc:", states[0].winInfo?.winner, "-", states[0].winInfo?.reason);
  }

  console.log("\n🎉 LUỒNG CHƠI HOẠT ĐỘNG ĐẦY ĐỦ!");
  socks.forEach((s) => s.disconnect());
  process.exit(0);
}

main().catch((e) => {
  console.error("✗ Test lỗi:", e.message);
  process.exit(1);
});
