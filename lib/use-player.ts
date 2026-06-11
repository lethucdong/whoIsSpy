"use client";

import { useCallback, useEffect, useState } from "react";
import { PlayerIdentity } from "./types";
import { randomAvatar, randomName } from "./utils";

const KEY = "glds_player";

function createIdentity(): PlayerIdentity {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    name: randomName(),
    avatar: randomAvatar(),
  };
}

/** Danh tính người chơi lưu ở localStorage (không cần đăng nhập). */
export function usePlayer() {
  const [player, setPlayer] = useState<PlayerIdentity | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setPlayer(JSON.parse(raw));
      } else {
        const id = createIdentity();
        localStorage.setItem(KEY, JSON.stringify(id));
        setPlayer(id);
      }
    } catch {
      setPlayer(createIdentity());
    }
  }, []);

  const update = useCallback((patch: Partial<PlayerIdentity>) => {
    setPlayer((prev) => {
      const next = { ...(prev ?? createIdentity()), ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { player, update, ready: player !== null };
}
