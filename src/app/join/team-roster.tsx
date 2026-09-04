import type { Castaway } from "@/generated/prisma/client";

// Read-only reveal of a locked-in team, reusing the Cast page's photo-card visual language
// (aspect-square photo, initials fallback, red X overlay once voted out, trophy on the winner).
// pointsByCastawayId values are each pick's full contribution to the team total - already
// including the Power Player multiplier and win bonus, computed by getStandings().
export function TeamRoster({
  castaways,
  powerPlayerId,
  pointsByCastawayId,
  totalPoints,
}: {
  castaways: Castaway[];
  powerPlayerId: number | null;
  pointsByCastawayId: Record<number, number>;
  totalPoints: number;
}) {
  return (
    <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {castaways.map((castaway) => {
          const isPowerPlayer = castaway.id === powerPlayerId;
          const points = pointsByCastawayId[castaway.id] ?? 0;
          return (
            <div
              key={castaway.id}
              className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-xl ${
                isPowerPlayer ? "border-accent-400 ring-2 ring-accent-300" : "border-neutral-200"
              }`}
            >
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
                {castaway.isEliminated && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-black text-red-600 opacity-90">✕</span>
                  </div>
                )}
                {isPowerPlayer && (
                  <span className="absolute left-1 top-1 whitespace-nowrap rounded-full bg-accent-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                    ⭐ Power Player
                  </span>
                )}
                {castaway.placement === 1 && (
                  <span className="absolute right-1 top-1 text-2xl drop-shadow" title="Sole Survivor">
                    🏆
                  </span>
                )}
                {castaway.isEliminated && castaway.eliminatedWeek != null && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 text-center text-[11px] font-semibold text-white">
                    Voted out — Wk {castaway.eliminatedWeek}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-sm font-semibold" title={castaway.name}>
                  {castaway.name}
                </span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-xs font-semibold text-neutral-600">
                  {points}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-50 px-4 py-3">
        <span className="text-sm font-semibold text-accent-700">Team Total</span>
        <span className="font-mono text-2xl font-bold text-accent-700">{totalPoints}</span>
      </div>
    </div>
  );
}
