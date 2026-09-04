import { getAllSeasons, getSeasonForView } from "@/lib/scoring";
import { getSession } from "@/lib/auth";
import { SeasonSwitcher } from "@/components/season-switcher";
import { NoSeasonYet } from "@/components/no-season-yet";

export default async function RulesPage({
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

  const rows = [
    { label: "Won a challenge (pre-merge)", value: season.challengeWinPreMerge },
    { label: "Survived tribal council (pre-merge)", value: season.tribalSurvivePreMerge },
    { label: "Won a challenge (post-merge)", value: season.challengeWinPostMerge },
    { label: "Survived tribal council (post-merge)", value: season.tribalSurvivePostMerge },
    { label: "Sole Survivor (1st place)", value: season.firstPlacePoints },
    { label: "Runner-up (2nd place)", value: season.secondPlacePoints },
    { label: "Third place", value: season.thirdPlacePoints },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SeasonSwitcher seasons={allSeasons} currentNumber={season.number} basePath="/rules" />

      <h1 className="font-display text-3xl tracking-wide text-white drop-shadow-lg">
        League Rules {allSeasons.length > 1 && `— Season ${season.number}`}
      </h1>

      <section className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h2 className="mb-2 font-semibold">Scoring</h2>
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-neutral-100 last:border-0">
                <td className="py-1.5 text-neutral-600">{row.label}</td>
                <td className="py-1.5 text-right font-mono font-semibold">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h2 className="mb-2 font-semibold">Power Player</h2>
        <p className="text-sm text-neutral-600">
          Each team designates one of its 5 picks as their <strong>Power Player</strong>. That
          castaway&apos;s points count <strong>{season.powerPlayerMultiplier}x</strong> toward the
          team&apos;s total. If your Power Player is crowned Sole Survivor, your team gets an extra{" "}
          <strong>{season.powerPlayerWinBonus} points</strong>.
        </p>
      </section>

      <section className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h2 className="mb-2 font-semibold">Draft</h2>
        <p className="text-sm text-neutral-600">
          Everyone drafts independently — there&apos;s no exclusivity, so multiple teams can pick the
          same castaway. No trades once the season locks (typically after episode one).
        </p>
      </section>

      <section className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h2 className="mb-2 font-semibold">Winning</h2>
        <p className="text-sm text-neutral-600">
          The fantasy team with the most points at the end of the season wins the league.
        </p>
      </section>
    </div>
  );
}
