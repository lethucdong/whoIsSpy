"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "./socket-context";
import { usePlayer } from "./use-player";
import { SOCKET_EVENTS as EV } from "./socket/events";
import { RoomSettings, RoomState } from "./types";
import { toast } from "@/components/ui/toaster";

/** Kết nối vào một phòng theo mã & nhận trạng thái realtime. */
export function useRoom(code?: string) {
  const { socket, connected } = useSocket();
  const { player } = usePlayer();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joined, setJoined] = useState(false);

  // Lắng nghe trạng thái phòng & lỗi
  useEffect(() => {
    if (!socket) return;
    const onState = (state: RoomState) => setRoom(state);
    const onError = (msg: string) => toast.error(msg || "Có lỗi xảy ra");
    socket.on(EV.ROOM_STATE, onState);
    socket.on(EV.ERROR, onError);
    return () => {
      socket.off(EV.ROOM_STATE, onState);
      socket.off(EV.ERROR, onError);
    };
  }, [socket]);

  // Tự động vào phòng khi đã có socket + player + code
  useEffect(() => {
    if (!socket || !connected || !player || !code || joined) return;
    socket.emit(
      EV.ROOM_JOIN,
      { code, player },
      (res: { ok: boolean; error?: string }) => {
        if (res?.ok) setJoined(true);
        else toast.error(res?.error || "Không vào được phòng");
      }
    );
  }, [socket, connected, player, code, joined]);

  const me = room?.players.find((p) => p.id === player?.id) ?? null;
  const isHost = !!me?.isHost;

  // ----- Hành động -----
  const emit = useCallback(
    (event: string, ...args: unknown[]) => socket?.emit(event, ...args),
    [socket]
  );

  const actions = {
    setReady: (ready: boolean) => emit(EV.PLAYER_READY, ready),
    updateSettings: (s: Partial<RoomSettings>) =>
      emit(EV.ROOM_UPDATE_SETTINGS, s),
    start: () => emit(EV.GAME_START),
    reveal: () => emit(EV.CARD_REVEAL),
    forceDiscuss: () => emit(EV.FORCE_DISCUSS),
    nextSpeaker: () => emit(EV.NEXT_SPEAKER),
    skipToVote: () => emit(EV.SKIP_TO_VOTE),
    vote: (targetId: string) => emit(EV.VOTE_CAST, targetId),
    skipVote: () => emit(EV.VOTE_SKIP),
    nextRound: () => emit(EV.NEXT_ROUND),
    resetLobby: () => emit(EV.RESET_LOBBY),
    leave: () => emit(EV.ROOM_LEAVE),
  };

  return { room, me, isHost, player, connected, joined, actions };
}
