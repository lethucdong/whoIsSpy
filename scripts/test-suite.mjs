import { io } from "socket.io-client";

const URL = "http://localhost:3000";
const EV = {
  ROOM_CREATE: "room:create", ROOM_JOIN: "room:join", ROOM_LEAVE: "room:leave",
  PLAYER_READY: "player:ready", GAME_START: "game:start", CARD_REVEAL: "card:reveal",
  SKIP_TO_VOTE: "game:skipToVote", VOTE_CAST: "vote:cast", VOTE_SKIP: "vote:skip", NEXT_ROUND: "game:nextRound",
  ROOM_STATE: "room:state", ERROR: "game:error",
};
const mk = (n) => ({ id: `p-${n}-${Math.random().toString(36).slice(2)}`, name: `P${n}`, avatar: "🦊" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const conn = () => io(URL, { transports: ["websocket"], forceNew: true });

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

/** Chờ tới khi state thỏa pred — kiểm tra snapshot mới nhất TRƯỚC để tránh
 *  bỏ lỡ sự kiện đã phát trong lúc chuyển tiếp. */
function waitFor(sock, getLatest, pred, label, ms = 9000) {
  return new Promise((res, rej) => {
    const cur = getLatest();
    if (cur && pred(cur)) return res(cur);
    const t = setTimeout(() => rej(new Error("timeout: " + label)), ms);
    const h = (s) => { if (pred(s)) { clearTimeout(t); sock.off(EV.ROOM_STATE, h); res(s); } };
    sock.on(EV.ROOM_STATE, h);
  });
}

async function setup(n, settings) {
  const players = Array.from({ length: n }, (_, i) => mk(i + 1));
  const socks = players.map(conn);
  const latest = players.map(() => null);
  const caps = players.map(() => null);
  socks.forEach((s, i) => {
    s.on(EV.ROOM_STATE, (st) => { latest[i] = st; if (st.phase === "REVEAL") caps[i] = st; });
    s.on(EV.ERROR, (e) => console.log(`    ⚠ error[${i}]:`, e));
  });
  await Promise.all(socks.map((s) => new Promise((r) => s.on("connect", r))));
  const code = await new Promise((res) => socks[0].emit(EV.ROOM_CREATE, { player: players[0], settings }, (r) => res(r.code)));
  for (let i = 1; i < n; i++) await new Promise((res) => socks[i].emit(EV.ROOM_JOIN, { code, player: players[i] }, () => res()));
  await waitFor(socks[0], () => latest[0], (s) => s.players.length === n, "all joined");
  for (let i = 1; i < n; i++) socks[i].emit(EV.PLAYER_READY, true);
  await waitFor(socks[0], () => latest[0], (s) => s.players.every((p) => p.isHost || p.ready), "all ready");
  socks[0].emit(EV.GAME_START);
  await waitFor(socks[0], () => latest[0], (s) => s.phase === "REVEAL", "reveal");
  await sleep(200);
  const roleOf = (i) => caps[i]?.players.find((p) => p.id === players[i].id)?.role;
  const wordOf = (i) => caps[i]?.players.find((p) => p.id === players[i].id)?.word;
  const w = (pred, label, ms) => waitFor(socks[0], () => latest[0], pred, label, ms);
  const alive = (i) => latest[i]?.players.find((p) => p.id === players[i].id)?.alive;
  return { players, socks, code, latest, caps, roleOf, wordOf, w, alive };
}

const reveal = (socks) => socks.forEach((s) => s.emit(EV.CARD_REVEAL));
const close = (socks) => socks.forEach((s) => s.disconnect());

// Vai trò bị ẩn trong lúc chơi → người quan sát suy ra gián điệp qua TỪ KHÓA:
// gián điệp nhận từ khác số đông (dân thường dùng chung một từ).
function spyIndicesByWord(indices, wordOf) {
  const freq = {};
  indices.forEach((i) => { const word = wordOf(i); freq[word] = (freq[word] ?? 0) + 1; });
  const minCount = Math.min(...Object.values(freq));
  return indices.filter((i) => freq[wordOf(i)] === minCount);
}

async function scenarioA() {
  console.log("\n▶ A) Vote trúng gián điệp → Dân thường thắng");
  const { players, socks, wordOf, latest, w } = await setup(3, { spyCount: 1 });
  const spies = spyIndicesByWord([0, 1, 2], wordOf);
  const spyIdx = spies[0];
  check("đúng 1 gián điệp", spies.length === 1, `(${spies.length})`);
  check("vai trò bị ẩn lúc REVEAL", [0, 1, 2].every((i) => latest[i].players.every((p) => p.role === undefined)));
  reveal(socks);
  await w((s) => s.phase === "DISCUSS", "discuss");
  socks[0].emit(EV.SKIP_TO_VOTE);
  await w((s) => s.phase === "VOTE", "vote");
  socks.forEach((s) => s.emit(EV.VOTE_CAST, players[spyIdx].id));
  await w((s) => s.phase === "ENDED", "ended");
  check("winner = CIVILIAN", latest[0].winInfo?.winner === "CIVILIAN", `(got ${latest[0].winInfo?.winner})`);
  check("lộ diện đủ vai trò", latest[0].winInfo?.reveals.length === 3);
  check("kết thúc mới thấy vai trò", latest[0].players.every((p) => p.role !== undefined));
  close(socks);
}

async function scenarioB() {
  console.log("\n▶ B) Vote trúng dân thường → Gián điệp thắng (3 người)");
  const { players, socks, wordOf, latest, w } = await setup(3, { spyCount: 1 });
  const spies = spyIndicesByWord([0, 1, 2], wordOf);
  const civIdx = [0, 1, 2].find((i) => !spies.includes(i));
  reveal(socks);
  await w((s) => s.phase === "DISCUSS", "discuss");
  socks[0].emit(EV.SKIP_TO_VOTE);
  await w((s) => s.phase === "VOTE", "vote");
  socks.forEach((s) => s.emit(EV.VOTE_CAST, players[civIdx].id));
  await w((s) => s.phase === "ENDED", "ended");
  check("winner = SPY", latest[0].winInfo?.winner === "SPY", `(got ${latest[0].winInfo?.winner})`);
  close(socks);
}

async function scenarioC() {
  console.log("\n▶ C) Phân vai gián điệp & từ khóa");
  const { socks, wordOf } = await setup(5, { spyCount: 1 });
  const idx = [0, 1, 2, 3, 4];
  const spies = spyIndicesByWord(idx, wordOf);
  const civs = idx.filter((i) => !spies.includes(i));
  check("đúng 1 gián điệp", spies.length === 1, `(${spies.length})`);
  check("đúng 4 dân thường", civs.length === 4, `(${civs.length})`);
  check("ai cũng có từ khóa", idx.every((i) => wordOf(i) != null));
  check("gián điệp có từ khác dân", wordOf(spies[0]) !== wordOf(civs[0]) && wordOf(spies[0]) != null);
  close(socks);
}

async function scenarioD() {
  console.log("\n▶ D) Chủ phòng rời phòng → chuyển quyền host");
  const players = [mk(1), mk(2), mk(3)];
  const socks = players.map(conn);
  const latest = players.map(() => null);
  socks.forEach((s, i) => s.on(EV.ROOM_STATE, (st) => (latest[i] = st)));
  await Promise.all(socks.map((s) => new Promise((r) => s.on("connect", r))));
  const code = await new Promise((res) => socks[0].emit(EV.ROOM_CREATE, { player: players[0] }, (r) => res(r.code)));
  for (let i = 1; i < 3; i++) await new Promise((res) => socks[i].emit(EV.ROOM_JOIN, { code, player: players[i] }, () => res()));
  await waitFor(socks[1], () => latest[1], (s) => s.players.length === 3, "joined");
  check("host ban đầu = P1", latest[1].hostId === players[0].id);
  socks[0].emit(EV.ROOM_LEAVE);
  await waitFor(socks[1], () => latest[1], (s) => s.players.length === 2, "host left");
  check("host mới = P2", latest[1].hostId === players[1].id, `(got ${latest[1].hostId})`);
  check("P2 trở thành isHost", latest[1].players.find((p) => p.id === players[1].id)?.isHost === true);
  close(socks);
}

async function scenarioE() {
  console.log("\n▶ E) Hòa phiếu → không loại ai");
  const { players, socks, latest, w } = await setup(4, { spyCount: 1 });
  reveal(socks);
  await w((s) => s.phase === "DISCUSS", "discuss");
  socks[0].emit(EV.SKIP_TO_VOTE);
  await w((s) => s.phase === "VOTE", "vote");
  socks[0].emit(EV.VOTE_CAST, players[2].id);
  socks[1].emit(EV.VOTE_CAST, players[2].id);
  socks[2].emit(EV.VOTE_CAST, players[0].id);
  socks[3].emit(EV.VOTE_CAST, players[0].id);
  await w((s) => s.phase === "RESULT", "result");
  await sleep(150);
  check("không ai bị loại", latest[0].lastResult?.eliminatedId === null);
  check("đánh dấu hòa", latest[0].lastResult?.tie === true);
  check("vẫn 4 người sống", latest[0].players.filter((p) => p.alive).length === 4);
  close(socks);
}

async function scenarioF() {
  console.log("\n▶ F) Chơi nhiều vòng (vòng 2 vào thẳng thảo luận)");
  const { players, socks, wordOf, latest, w, alive } = await setup(5, { spyCount: 1 });
  const i5 = [0, 1, 2, 3, 4];
  const spies = spyIndicesByWord(i5, wordOf);
  const spyIdx = spies[0];
  const civIdx = i5.find((i) => !spies.includes(i));
  reveal(socks);
  await w((s) => s.phase === "DISCUSS", "discuss r1");
  socks[0].emit(EV.SKIP_TO_VOTE);
  await w((s) => s.phase === "VOTE", "vote r1");
  socks.forEach((s) => s.emit(EV.VOTE_CAST, players[civIdx].id));
  await w((s) => s.phase === "RESULT", "result r1");
  await sleep(150);
  check("vòng 1: loại 1 dân, chưa kết thúc", latest[0].phase === "RESULT" && latest[0].players.filter((p) => p.alive).length === 4);
  socks[0].emit(EV.NEXT_ROUND);
  await w((s) => s.phase === "DISCUSS" && s.round === 2, "discuss r2");
  check("vòng 2 vào thẳng DISCUSS (không REVEAL)", latest[0].phase === "DISCUSS" && latest[0].round === 2);
  socks[0].emit(EV.SKIP_TO_VOTE);
  await w((s) => s.phase === "VOTE", "vote r2");
  socks.forEach((s, i) => { if (alive(i)) s.emit(EV.VOTE_CAST, players[spyIdx].id); });
  await w((s) => s.phase === "ENDED", "ended");
  check("kết thúc: Dân thắng", latest[0].winInfo?.winner === "CIVILIAN", `(got ${latest[0].winInfo?.winner})`);
  close(socks);
}

async function scenarioG() {
  console.log("\n▶ G) Không bỏ phiếu (abstain)");
  const { players, socks, wordOf, latest, w } = await setup(3, { spyCount: 1 });
  reveal(socks);
  await w((s) => s.phase === "DISCUSS", "discuss");
  socks[0].emit(EV.SKIP_TO_VOTE);
  await w((s) => s.phase === "VOTE", "vote");
  // Cả 3 chọn không bỏ phiếu → kết thúc lượt mà không loại ai
  socks.forEach((s) => s.emit(EV.VOTE_SKIP));
  await w((s) => s.phase === "RESULT", "result");
  await sleep(150);
  check("tất cả bỏ qua → không ai bị loại", latest[0].lastResult?.eliminatedId === null);
  check("đánh dấu không loại", latest[0].lastResult?.tie === true);
  check("vẫn 3 người sống", latest[0].players.filter((p) => p.alive).length === 3);

  // Lượt sau: 2 người vote gián điệp, gián điệp bỏ qua → vẫn loại được
  socks[0].emit(EV.NEXT_ROUND);
  await w((s) => s.phase === "DISCUSS" && s.round === 2, "discuss r2");
  socks[0].emit(EV.SKIP_TO_VOTE);
  await w((s) => s.phase === "VOTE", "vote r2");
  const spyIdx = spyIndicesByWord([0, 1, 2], wordOf)[0];
  [0, 1, 2].forEach((i) => {
    if (i === spyIdx) socks[i].emit(EV.VOTE_SKIP);
    else socks[i].emit(EV.VOTE_CAST, players[spyIdx].id);
  });
  await w((s) => s.phase === "ENDED", "ended");
  check("1 người bỏ qua vẫn loại được gián điệp", latest[0].winInfo?.winner === "CIVILIAN", `(got ${latest[0].winInfo?.winner})`);
  close(socks);
}

async function main() {
  try {
    await scenarioA();
    await scenarioB();
    await scenarioC();
    await scenarioD();
    await scenarioE();
    await scenarioF();
    await scenarioG();
  } catch (e) {
    console.log("✗ Lỗi runtime:", e.message);
    fail++;
  }
  console.log(`\n========== KẾT QUẢ: ${pass} pass, ${fail} fail ==========`);
  process.exit(fail === 0 ? 0 : 1);
}
main();
