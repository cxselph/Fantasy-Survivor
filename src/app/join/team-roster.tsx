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
              className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-md transition hover:shadow-xl ${
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
                  <span className="absolute left-1 top-1 rounded-full bg-accent-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                    ⭐ Power Player
                  </span>
                )}
                {castaway.placement === 1 && (
                  <span className="absolute right-1 top-1 text-2xl" title="Sole Survivor">
                    🏆
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold">{castaway.name}</span>
                  <span className="font-mono text-xs text-neutral-500">{points} pts</span>
                </div>
                {castaway.isEliminated && castaway.eliminatedWeek != null && (
                  <span className="text-xs font-medium text-red-600">Voted out — Week {castaway.eliminatedWeek}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="text-sm font-medium text-neutral-600">Total points</span>
        <span className="font-mono text-lg font-bold text-accent-700">{totalPoints}</span>
      </div>
    </div>
  );
}
