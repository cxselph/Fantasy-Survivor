import { requireAdmin } from "@/lib/auth";
import { getActiveSeason } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { ScoreEventType } from "@/generated/prisma/enums";
import { WeeklyForm, type WeeklyEntry } from "./weekly-form";
import { CustomAdjustmentForm, DeleteEventButton } from "./custom-form";
import { BackToAdmin } from "@/components/back-to-admin";
import { NoSeasonYet } from "@/components/no-season-yet";

export default async function AdminScoringPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireAdmin();
  const { week: weekParam } = await searchParams;

  let season;
  try {
    season = await getActiveSeason();
  } catch {
    return <NoSeasonYet isAdmin />;
  }

  const castaways = await prisma.castaway.findMany({
    where: { seasonId: season.id },
    orderBy: [{ isEliminated: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  let week = weekParam ? Number(weekParam) : NaN;
  if (!Number.isInteger(week) || week < 1) {
    const latest = await prisma.scoreEvent.aggregate({
      where: { seasonId: season.id, type: { not: ScoreEventType.CUSTOM } },
      _max: { week: true },
    });
    week = Math.min((latest._max.week ?? 0) + 1, season.totalWeeks);
  }

  const weekEvents = await prisma.scoreEvent.findMany({
    where: {
      seasonId: season.id,
      week,
      type: { in: [ScoreEventType.CHALLENGE_WIN, ScoreEventType.TRIBAL_SURVIVE, ScoreEventType.FINAL_PLACEMENT] },
    },
  });

  const entries = new Map<number, WeeklyEntry>();
  for (const event of weekEvents) {
    const entry = entries.get(event.castawayId) ?? { challenge: false, tribal: false, placement: null };
    if (event.type === ScoreEventType.CHALLENGE_WIN) entry.challenge = true;
    if (event.type === ScoreEventType.TRIBAL_SURVIVE) entry.tribal = true;
    if (event.type === ScoreEventType.FINAL_PLACEMENT) {
      const castaway = castaways.find((c) => c.id === event.castawayId);
      entry.placement = (castaway?.placement as 1 | 2 | 3 | null) ?? null;
    }
    entries.set(event.castawayId, entry);
  }

  const customEvents = await prisma.scoreEvent.findMany({
    where: { seasonId: season.id, type: ScoreEventType.CUSTOM },
    include: { castaway: true },
    orderBy: { week: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Weekly Scoring</h1>
          <p className="text-sm text-neutral-500">
            Season {season.number} · {season.totalWeeks} weeks ·{" "}
            {season.mergeWeek ? `Merge at week ${season.mergeWeek}` : "Merge week not set yet"}
          </p>
        </div>
        <BackToAdmin />
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <WeeklyForm key={week} week={week} totalWeeks={season.totalWeeks} castaways={castaways} entries={entries} />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Custom Point Adjustments</h2>
        <p className="mb-3 text-sm text-neutral-500">
          For one-off situations the standard rules don&apos;t cover.
        </p>
        <CustomAdjustmentForm castaways={castaways} />
        {customEvents.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1 text-sm">
            {customEvents.map((event) => (
              <li key={event.id} className="flex items-center justify-between border-b border-neutral-100 py-1">
                <span>
                  Week {event.week} · {event.castaway.name} · {event.label}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono">{event.points > 0 ? `+${event.points}` : event.points}</span>
                  <DeleteEventButton
                    id={event.id}
                    description={`Week ${event.week} · ${event.castaway.name} · ${event.label}`}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
