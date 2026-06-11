"use client";

import { useEffect, useState } from "react";

/** Đếm ngược tới mốc epoch ms (phaseEndsAt). Trả về số giây còn lại. */
export function useCountdown(endsAt?: number | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const secs = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(secs);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  return remaining;
}
