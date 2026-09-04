"use client";

import { useState, useTransition } from "react";
import type { Castaway } from "@/generated/prisma/client";
import { setEliminated } from "@/lib/actions/cast";

export function CastawayCard({
  castaway,
  totalPoints,
  isAdmin,
  tribeName,
}: {
  castaway: Castaway;
  totalPoints: number;
  isAdmin: boolean;
  tribeName?: string;
}) {
  const [week, setWeek] = useState(castaway.eliminatedWeek?.toString() ?? "");
  const [isEliminated, setIsEliminated] = useState(castaway.isEliminated);
  const [pending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    setIsEliminated(checked);
    startTransition(() => {
      setEliminated(castaway.id, checked, checked ? Number(week) || null : null);
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-md transition hover:shadow-xl">
      <div className="relative aspect-square w-full bg-neutral-200">
        {castaway.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={castaway.photoUrl} alt={castaway.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-400">
            {castaway.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
        {isEliminated && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-black text-red-600 opacity-90">✕</span>
          </div>
        )}
        {castaway.placement === 1 && (
          <span className="absolute right-1 top-1 text-2xl" title="Sole Survivor">
            🏆
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{castaway.name}</span>
          <span className="font-mono text-xs text-neutral-500">{totalPoints}</span>
        </div>
        {castaway.bio && <span className="text-xs text-neutral-500">{castaway.bio}</span>}
        {tribeName && <span className="text-xs text-neutral-400">{tribeName}</span>}
        {isEliminated && castaway.eliminatedWeek != null && (
          <span className="text-xs font-medium text-red-600">Voted out — Week {castaway.eliminatedWeek}</span>
        )}

        {isAdmin && (
          <div className="mt-1 flex items-center gap-2 border-t border-neutral-100 pt-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={isEliminated}
                disabled={pending}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              Voted out
            </label>
            {!isEliminated && (
              <input
                type="number"
                min={1}
                placeholder="wk"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-12 rounded border border-neutral-300 px-1 py-0.5"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
