"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  WifiOff,
  Mic,
  SkipForward,
  Vote as VoteIcon,
  ArrowRight,
  Home,
  RotateCcw,
  Trophy,
  Skull,
  PartyPopper,
  Ban,
} from "lucide-react";
import { Screen } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RoleCard } from "@/components/game/role-card";
import { SecretChip } from "@/components/game/secret-chip";
import { PhaseTimer } from "@/components/game/phase-timer";
import { PlayerRoster } from "@/components/game/player-roster";
import { useRoom } from "@/lib/use-room";
import { useCountdown } from "@/lib/use-countdown";
import { recordHistory } from "@/lib/use-history";
import { ROLE_LABEL, RoomState, SKIP_VOTE } from "@/lib/types";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const code = id?.toUpperCase();
  const router = useRouter();
  const { room, me, isHost, player, connected, actions } = useRoom(code);

  // Trở lại sảnh chờ nếu chủ phòng reset
  useEffect(() => {
    if (room && room.phase === "LOBBY") {
      router.replace(`/room/${code}`);
    }
  }, [room?.phase, code, router]);

  // Lưu lịch sử khi kết thúc
  const recorded = useRef(false);
  useEffect(() => {
    if (room?.phase === "ENDED" && room.winInfo && me && !recorded.current) {
      recorded.current = true;
      const mine = room.winInfo.reveals.find((r) => r.id === me.id);
      recordHistory({
        id: `${room.code}-${room.winInfo.reveals.length}-${Date.now()}`,
        code: room.code,
        endedAt: Date.now(),
        winner: room.winInfo.winner,
        myRole: mine?.role ?? null,
        won:
          (mine?.role === "SPY" && room.winInfo.winner === "SPY") ||
          (mine?.role !== "SPY" && room.winInfo.winner === "CIVILIAN"),
        rounds: room.round,
        players: room.players.length,
        civilianWord: room.winInfo.civilianWord,
        spyWord: room.winInfo.spyWord,
      });
    }
  }, [room?.phase]);

  if (!room || !me) {
    return (
      <Screen className="items-center justify-center gap-3">
        {connected ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary-soft" />
        ) : (
          <WifiOff className="h-8 w-8 text-muted" />
        )}
        <p className="text-muted">Đang tải trận đấu...</p>
      </Screen>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AnimatePresence mode="wait">
        {room.phase === "REVEAL" && (
          <RevealPhase key="reveal" room={room} me={me} isHost={isHost} actions={actions} />
        )}
        {room.phase === "DISCUSS" && (
          <DiscussPhase key="discuss" room={room} me={me} isHost={isHost} actions={actions} />
        )}
        {room.phase === "VOTE" && (
          <VotePhase key="vote" room={room} me={me} actions={actions} />
        )}
        {room.phase === "RESULT" && (
          <ResultPhase key="result" room={room} isHost={isHost} actions={actions} />
        )}
        {room.phase === "ENDED" && (
          <EndedPhase key="ended" room={room} meId={me.id} isHost={isHost} actions={actions} router={router} />
        )}
      </AnimatePresence>
    </div>
  );
}

type Actions = ReturnType<typeof useRoom>["actions"];

function PhaseHeader({ round, children }: { round: number; children?: React.ReactNode }) {
  return (
    <div className="safe-top flex items-center justify-between px-4 pb-2 pt-3">
      <Badge variant="default">Vòng {round}</Badge>
      {children}
    </div>
  );
}

/* ---------------- REVEAL ---------------- */
function RevealPhase({
  room,
  me,
  isHost,
  actions,
}: {
  room: RoomState;
  me: NonNullable<ReturnType<typeof useRoom>["me"]>;
  isHost: boolean;
  actions: Actions;
}) {
  const revealedCount = room.players.filter((p) => p.alive && p.hasRevealed).length;
  const aliveCount = room.players.filter((p) => p.alive).length;
  const iRevealed = me.hasRevealed;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <PhaseHeader round={room.round}>
        <Badge variant="muted">
          {revealedCount}/{aliveCount} đã xem
        </Badge>
      </PhaseHeader>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h2 className="mb-1 text-center text-xl font-extrabold">
          Xem từ khóa của bạn
        </h2>
        <p className="mb-8 text-center text-sm text-muted">
          {me.role && me.role !== "CIVILIAN"
            ? "Ghi nhớ vai trò và giữ bí mật nhé!"
            : "Ghi nhớ từ khóa và đừng để lộ!"}
        </p>

        <RoleCard
          role={me.role}
          word={me.word ?? null}
          category={room.category}
          onRevealed={() => actions.reveal()}
        />
      </div>

      <div className="safe-bottom px-4 pb-3 pt-4">
        {iRevealed ? (
          isHost ? (
            <Button size="lg" className="w-full" onClick={actions.forceDiscuss}>
              <Mic className="h-5 w-5" /> Bắt đầu thảo luận
              {revealedCount < aliveCount && (
                <span className="text-xs opacity-80">
                  ({aliveCount - revealedCount} người chưa xem)
                </span>
              )}
            </Button>
          ) : (
            <div className="glass flex items-center justify-center gap-2 rounded-2xl py-4 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chờ mọi người xem từ khóa...
            </div>
          )
        ) : (
          <p className="text-center text-sm text-faint">
            👆 Chạm vào thẻ để xem từ khóa bí mật
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- DISCUSS ---------------- */
function DiscussPhase({
  room,
  me,
  isHost,
  actions,
}: {
  room: RoomState;
  me: NonNullable<ReturnType<typeof useRoom>["me"]>;
  isHost: boolean;
  actions: Actions;
}) {
  const meId = me.id;
  const remaining = useCountdown(room.phaseEndsAt);
  const speaker = room.players.find((p) => p.id === room.currentSpeakerId);
  const iAmSpeaking = room.currentSpeakerId === meId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <PhaseHeader round={room.round}>
        <SecretChip role={me.role} word={me.word ?? null} category={room.category} />
      </PhaseHeader>

      <div className="flex flex-col items-center px-4">
        <PhaseTimer
          remaining={remaining}
          total={room.settings.discussSeconds}
          label="thảo luận"
        />

        {speaker ? (
          <motion.div
            key={speaker.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 flex flex-col items-center"
          >
            <p className="text-xs uppercase tracking-wide text-faint">
              Đang tới lượt
            </p>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-2">
              <Avatar emoji={speaker.avatar} size="md" ring />
              <div>
                <p className="font-bold">
                  {speaker.name}
                  {iAmSpeaking && " — tới bạn!"}
                </p>
                <p className="flex items-center gap-1 text-xs text-primary-soft">
                  <Mic className="h-3 w-3" /> đang mô tả từ khóa
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <p className="mt-4 text-sm text-muted">Cả phòng cùng thảo luận tự do</p>
        )}
      </div>

      <div className="mt-6 flex-1 px-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Người chơi còn sống
        </h3>
        <PlayerRoster
          players={room.players}
          speakerId={room.currentSpeakerId}
          selfId={meId}
        />
      </div>

      <div className="safe-bottom flex gap-2 px-4 pb-3 pt-4">
        {(iAmSpeaking || isHost) && speaker && (
          <Button variant="glass" className="flex-1" onClick={actions.nextSpeaker}>
            <SkipForward className="h-5 w-5" /> Người tiếp theo
          </Button>
        )}
        {isHost && (
          <Button variant="primary" className="flex-1" onClick={actions.skipToVote}>
            <VoteIcon className="h-5 w-5" /> Bỏ phiếu ngay
          </Button>
        )}
        {!isHost && !iAmSpeaking && (
          <div className="glass flex flex-1 items-center justify-center rounded-2xl py-3 text-sm text-muted">
            Lắng nghe & suy luận...
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- VOTE ---------------- */
function VotePhase({
  room,
  me,
  actions,
}: {
  room: RoomState;
  me: NonNullable<ReturnType<typeof useRoom>["me"]>;
  actions: Actions;
}) {
  const meId = me.id;
  const remaining = useCountdown(room.phaseEndsAt);
  const myDecision = room.votes?.find((v) => v.voterId === meId)?.targetId ?? null;
  const abstained = myDecision === SKIP_VOTE;
  const myVote = abstained ? null : myDecision;

  const counts: Record<string, number> = {};
  room.votes?.forEach((v) => {
    if (v.targetId === SKIP_VOTE) return; // phiếu bỏ qua không hiện cho ai
    counts[v.targetId] = (counts[v.targetId] ?? 0) + 1;
  });
  const votedCount = room.votes?.length ?? 0;
  const aliveCount = room.players.filter((p) => p.alive).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <PhaseHeader round={room.round}>
        <div className="flex items-center gap-2">
          <SecretChip role={me.role} word={me.word ?? null} category={room.category} />
          <Badge variant="danger">
            {votedCount}/{aliveCount}
          </Badge>
        </div>
      </PhaseHeader>

      <div className="flex flex-col items-center px-4">
        <PhaseTimer remaining={remaining} total={room.settings.voteSeconds} label="bỏ phiếu" />
        <h2 className="mt-3 text-center text-xl font-extrabold">
          Ai là gián điệp? 🕵️
        </h2>
        <p className="mt-1 text-center text-sm text-muted">
          {me?.alive
            ? "Chạm vào người bạn nghi ngờ — hoặc bỏ qua"
            : "Bạn đã bị loại — chờ kết quả"}
        </p>
      </div>

      <div className="mt-6 flex-1 px-4">
        <PlayerRoster
          players={room.players}
          selfId={meId}
          votedTargetId={myVote}
          voteCounts={counts}
          selectable={!!me?.alive}
          onSelect={(id) => actions.vote(id)}
        />
      </div>

      <div className="safe-bottom px-4 pb-3 pt-4">
        {!me?.alive ? (
          <div className="glass flex items-center justify-center gap-2 rounded-2xl py-4 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ kết quả...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {abstained ? (
              <div className="glass flex items-center justify-center gap-2 rounded-2xl py-3 text-sm">
                <Ban className="h-4 w-4 text-faint" />
                <span className="text-muted">Bạn đã chọn không bỏ phiếu</span>
                <span className="text-faint">— có thể đổi</span>
              </div>
            ) : myVote ? (
              <div className="glass flex items-center justify-center gap-2 rounded-2xl py-3 text-sm">
                <span className="text-muted">Bạn đã bỏ phiếu cho</span>
                <b className="text-red-400">
                  {room.players.find((p) => p.id === myVote)?.name}
                </b>
                <span className="text-faint">— có thể đổi</span>
              </div>
            ) : (
              <p className="text-center text-sm text-faint">
                👆 Chọn một người để bỏ phiếu, hoặc bỏ qua
              </p>
            )}
            <Button
              variant={abstained ? "primary" : "glass"}
              className="w-full"
              onClick={actions.skipVote}
            >
              <Ban className="h-5 w-5" /> Không bỏ phiếu
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- RESULT ---------------- */
function ResultPhase({
  room,
  isHost,
  actions,
}: {
  room: RoomState;
  isHost: boolean;
  actions: Actions;
}) {
  const r = room.lastResult;
  const ended = room.phase === "ENDED";
  const maxVotes = Math.max(1, ...(r?.votes.map((v) => v.count) ?? [1]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <PhaseHeader round={room.round} />

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {r?.tie || !r?.eliminatedId ? (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="text-6xl">🤝</div>
            <h2 className="mt-3 text-2xl font-extrabold">Hòa phiếu!</h2>
            <p className="mt-1 text-sm text-muted">
              Không ai bị loại trong vòng này
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
            className="flex flex-col items-center text-center"
          >
            <p className="text-sm text-muted">Người bị loại</p>
            <div className="my-2 text-6xl">
              {room.players.find((p) => p.id === r.eliminatedId)?.avatar ?? "💀"}
            </div>
            <h2 className="text-2xl font-extrabold">{r.eliminatedName}</h2>
            <div
              className={`mt-3 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                r.eliminatedRole === "SPY"
                  ? "bg-danger/20 text-red-400"
                  : "bg-primary/20 text-primary-soft"
              }`}
            >
              {r.eliminatedRole === "SPY" ? "🕵️" : "👤"}
              {r.eliminatedRole ? ROLE_LABEL[r.eliminatedRole] : ""}
              {r.eliminatedRole === "SPY" && " — Bắt trúng rồi!"}
            </div>
          </motion.div>
        )}

        {/* Bảng phiếu */}
        <div className="mt-8 w-full max-w-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-faint">
            Kết quả bỏ phiếu
          </p>
          {r?.votes
            .filter((v) => v.count > 0)
            .map((v) => (
              <div key={v.targetId} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-xs text-muted">
                  {v.targetName}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-card-soft/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(v.count / maxVotes) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-primary to-primary-soft px-2 text-[10px] font-bold text-white"
                  >
                    {v.count}
                  </motion.div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {!ended && (
        <div className="safe-bottom px-4 pb-3 pt-4">
          {isHost ? (
            <Button size="lg" className="w-full" onClick={actions.nextRound}>
              <ArrowRight className="h-5 w-5" /> Vòng tiếp theo
            </Button>
          ) : (
            <div className="glass flex items-center justify-center gap-2 rounded-2xl py-4 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Chờ chủ phòng tiếp tục...
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- ENDED ---------------- */
function EndedPhase({
  room,
  meId,
  isHost,
  actions,
  router,
}: {
  room: RoomState;
  meId: string;
  isHost: boolean;
  actions: Actions;
  router: ReturnType<typeof useRouter>;
}) {
  const w = room.winInfo;
  if (!w) return null;
  const mine = w.reveals.find((r) => r.id === meId);
  const iWon =
    (mine?.role === "SPY" && w.winner === "SPY") ||
    (mine?.role !== "SPY" && w.winner === "CIVILIAN");
  const spyWin = w.winner === "SPY";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col"
    >
      <div className="safe-top flex flex-1 flex-col items-center px-4 pt-8">
        <motion.div
          initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="text-7xl"
        >
          {iWon ? "🎉" : spyWin ? "🕵️" : "👮"}
        </motion.div>

        <h1
          className={`mt-3 text-3xl font-extrabold ${
            spyWin ? "text-red-400" : "text-green-400"
          }`}
        >
          {spyWin ? "Gián Điệp Thắng!" : "Dân Thường Thắng!"}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
          {iWon ? (
            <span className="flex items-center gap-1 text-amber-400">
              <Trophy className="h-4 w-4" /> Bạn đã chiến thắng!
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted">
              <Skull className="h-4 w-4" /> Lần sau cố lên nhé!
            </span>
          )}
        </p>
        <p className="mt-2 max-w-xs text-center text-xs text-faint">{w.reason}</p>

        {/* Hai từ khóa */}
        <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-xs text-muted">Từ dân thường</p>
            <p className="mt-1 text-lg font-extrabold text-primary-soft">
              {w.civilianWord}
            </p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-xs text-muted">Từ gián điệp</p>
            <p className="mt-1 text-lg font-extrabold text-red-400">{w.spyWord}</p>
          </div>
        </div>

        {/* Lộ diện toàn bộ vai trò */}
        <div className="mt-6 w-full max-w-sm">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-faint">
            <PartyPopper className="h-3.5 w-3.5" /> Lộ diện
          </p>
          <div className="space-y-2">
            {w.reveals.map((p) => (
              <div
                key={p.id}
                className="glass flex items-center gap-3 rounded-2xl p-2.5"
              >
                <Avatar emoji={room.players.find((x) => x.id === p.id)?.avatar ?? "🦊"} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {p.name}
                    {p.id === meId && <span className="text-faint"> (bạn)</span>}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {`🗝️ ${p.word ?? "—"}`}
                  </span>
                </div>
                <Badge variant={p.role === "SPY" ? "danger" : "muted"}>
                  {p.role === "SPY" ? "🕵️ Gián điệp" : "👤 Dân"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="safe-bottom flex gap-2 px-4 pb-3 pt-4">
        <Button
          variant="glass"
          className="flex-1"
          onClick={() => {
            actions.leave();
            router.push("/");
          }}
        >
          <Home className="h-5 w-5" /> Trang chủ
        </Button>
        {isHost && (
          <Button className="flex-1" onClick={actions.resetLobby}>
            <RotateCcw className="h-5 w-5" /> Chơi lại
          </Button>
        )}
      </div>
    </motion.div>
  );
}
