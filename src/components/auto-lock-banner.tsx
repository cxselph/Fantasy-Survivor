"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "@/lib/timezone";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function AutoLockBanner({ autoLockAt, timezone }: { autoLockAt: string; timezone: string }) {
  const target = new Date(autoLockAt).getTime();
  // Starts null so the server-rendered markup has nothing to hydrate-mismatch against - the
  // real countdown fills in once mounted in the browser.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemainingMs(Math.max(0, target - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remainingMs === null || remainingMs <= 0) return null;

  const days = Math.floor(remainingMs / 86_400_000);
  const hours = Math.floor((remainingMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1_000);

  return (
    <div className="border-b border-white/20 bg-accent-600 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
        <span>🔒 Draft auto-locks in</span>
        <span className="font-mono tabular-nums">
          {days}d {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
        </span>
        <span className="text-white/80">({formatInTimeZone(new Date(target), timezone)})</span>
      </div>
    </div>
  );
}
