import { getAllSeasons, getSeasonForView, getStandings } from "@/lib/scoring";
import { getSession } from "@/lib/auth";
import { SeasonSwitcher } from "@/components/season-switcher";
import { NoSeasonYet } from "@/components/no-season-yet";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;

  let season, allSeasons;
  try {
    [season, allSeasons] = await Promise.all([
      getSeasonForView(seasonParam ? Number(seasonParam) : undefined),
      getAllSeasons(),
    ]);
  } catch {
    const session = await getSession();
    return <NoSeasonYet isAdmin={session?.role === "admin"} />;
  }

  const standings = await getStandings(season.id);

  return (
    <div className="flex flex-col gap-6">
      <SeasonSwitcher seasons={allSeasons} currentNumber={season.number} basePath="/" />

      <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h1 className="font-display text-3xl tracking-wide text-neutral-900">
          Season {season.number}: {season.name}
        </h1>
        <p className="text-sm text-neutral-500">
          {season.isActive
            ? season.draftLocked
              ? "Draft locked — picks are final."
              : "Draft open — teams can still be changed."
            : "Past season — viewing final results."}
          {season.mergeWeek != null && ` · Merge at week ${season.mergeWeek}.`}
        </p>
      </div>

      {standings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-white/50 bg-white/80 p-8 text-center text-neutral-500 backdrop-blur-sm">
          No teams yet.
          {season.isActive && (
            <>
              {" "}
              <a href="/join" className="font-medium text-orange-600 underline">
                Draft your team
              </a>{" "}
              to get on the board.
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {standings.map((team, index) => {
            const rank = index + 1;
            const medal = RANK_MEDALS[rank];
            return (
              <div
                key={team.teamId}
                className={`rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-sm transition hover:shadow-xl ${
                  rank === 1 ? "ring-2 ring-orange-400" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${
                        medal ? "bg-orange-100" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {medal ?? rank}
                    </span>
                    <h2 className="font-display text-xl tracking-wide text-neutral-900">{team.ownerName}</h2>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{team.total}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {team.picks.map((pick) => (
                    <div
                      key={pick.castawayId}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                        pick.isEliminated
                          ? "border-neutral-200 bg-neutral-50 text-neutral-400 line-through"
                          : "border-neutral-200 bg-neutral-50 text-neutral-700"
                      }`}
                    >
                      <span>{pick.name}</span>
                      {pick.isPowerPlayer && (
                        <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          PP
                        </span>
                      )}
                      <span className="font-mono text-xs text-neutral-500">{pick.contribution}</span>
                      {pick.placement === 1 && <span title="Sole Survivor">🏆</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
