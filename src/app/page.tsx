import { getAllSeasons, getSeasonForView, getStandings } from "@/lib/scoring";
import { SeasonSwitcher } from "@/components/season-switcher";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;
  const [season, allSeasons] = await Promise.all([
    getSeasonForView(seasonParam ? Number(seasonParam) : undefined),
    getAllSeasons(),
  ]);
  const standings = await getStandings(season.id);

  return (
    <div className="flex flex-col gap-6">
      <SeasonSwitcher seasons={allSeasons} currentNumber={season.number} basePath="/" />

      <div>
        <h1 className="text-2xl font-bold">
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
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
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
          {standings.map((team, index) => (
            <div key={team.teamId} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
                    {index + 1}
                  </span>
                  <h2 className="text-lg font-semibold">{team.ownerName}</h2>
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
          ))}
        </div>
      )}
    </div>
  );
}
