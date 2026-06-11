"use client";

import { useCallback, useEffect, useState } from "react";
import { Role } from "./types";

const KEY = "glds_history";

export interface HistoryEntry {
  id: string;
  code: string;
  endedAt: number;
  winner: "CIVILIAN" | "SPY" | null;
  myRole: Role | null;
  won: boolean;
  rounds: number;
  players: number;
  civilianWord: string;
  spyWord: string;
}

function read(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function recordHistory(entry: HistoryEntry) {
  try {
    const list = read();
    if (list.some((e) => e.id === entry.id)) return;
    list.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(read());
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  const stats = {
    total: history.length,
    wins: history.filter((h) => h.won).length,
    asSpy: history.filter((h) => h.myRole === "SPY").length,
    spyWins: history.filter((h) => h.myRole === "SPY" && h.won).length,
  };

  return { history, clear, stats };
}
