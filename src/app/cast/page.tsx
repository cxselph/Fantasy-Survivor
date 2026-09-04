import { getSession } from "@/lib/auth";
import { getAllSeasons, getSeasonForView } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { SeasonSwitcher } from "@/components/season-switcher";
import { NoSeasonYet } from "@/components/no-season-yet";
import { CastawayCard } from "./castaway-card";

export default async function CastPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;
  const session = await getSession();

  let season, allSeasons;
  try {
    [season, allSeasons] = await Promise.all([
      getSeasonForView(seasonParam ? Number(seasonParam) : undefined),
      getAllSeasons(),
    ]);
  } catch {
    return <NoSeasonYet isAdmin={session?.role === "admin"} />;
  }

  const [tribes, castaways] = await Promise.all([
    prisma.tribe.findMany({ where: { seasonId: season.id }, orderBy: { name: "asc" } }),
    prisma.castaway.findMany({
      where: { seasonId: season.id },
      include: { scoreEvents: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const active = castaways.filter((c) => !c.isEliminated);
  const votedOut = castaways
    .filter((c) => c.isEliminated)
    .sort((a, b) => (a.eliminatedWeek ?? 0) - (b.eliminatedWeek ?? 0) || a.name.localeCompare(b.name));

  const totalPointsFor = (c: (typeof castaways)[number]) => c.scoreEvents.reduce((sum, e) => sum + e.points, 0);

  // Grid tops out at 5 columns (lg:grid-cols-5) - once that few or fewer are still active,
  // separate tribe bars just waste vertical space on near-empty groups (tribes stop meaning
  // much this late anyway), so collapse into one row sorted by points instead.
  const MAX_ROW = 5;
  const collapseToOneRow = active.length > 0 && active.length <= MAX_ROW;

  // Only still-active tribes get a section - once everyone on a tribe is voted
  // out (or the season merges), it drops out instead of leaving an empty header.
  const groups = collapseToOneRow
    ? [{ tribe: null, castaways: [...active].sort((a, b) => totalPointsFor(b) - totalPointsFor(a)), collapsed: true }]
    : [
        ...tribes.map((tribe) => ({
          tribe,
          castaways: active.filter((c) => c.tribeId === tribe.id),
          collapsed: false,
        })),
        { tribe: null, castaways: active.filter((c) => c.tribeId === null), collapsed: false },
      ].filter((group) => group.castaways.length > 0);

  const tribeNameById = new Map(tribes.map((t) => [t.id, t.name]));

  // Past seasons are frozen - only the active season can be edited.
  const isAdmin = session?.role === "admin" && season.isActive;

  return (
    <div className="flex flex-col gap-8">
      <SeasonSwitcher seasons={allSeasons} currentNumber={season.number} basePath="/cast" />

      <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h1 className="font-display text-3xl tracking-wide text-neutral-900">The Cast</h1>
        <p className="text-sm text-neutral-500">
          Season {season.number}: {season.name}
        </p>
      </div>

      {groups.map(({ tribe, castaways: members, collapsed }) => (
        <div key={tribe?.id ?? (collapsed ? "final" : "unassigned")}>
          <h2
            className={`font-display mb-3 block w-full rounded-xl px-4 py-4 text-center text-2xl tracking-wide text-white shadow-lg ${collapsed ? "bg-accent-600" : ""}`}
            style={collapsed ? undefined : { backgroundColor: tribe?.color ?? "#737373" }}
          >
            {collapsed ? `Final ${members.length}` : (tribe?.name ?? "Tribe TBD")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {members.map((castaway) => (
              <CastawayCard
                key={castaway.id}
                castaway={castaway}
                totalPoints={castaway.scoreEvents.reduce((sum, e) => sum + e.points, 0)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      ))}

      {votedOut.length > 0 && (
        <div>
          <h2 className="font-display mb-3 block w-full rounded-xl bg-neutral-700 px-4 py-4 text-center text-2xl tracking-wide text-white shadow-lg">
            Voted Out
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {votedOut.map((castaway) => (
              <CastawayCard
                key={castaway.id}
                castaway={castaway}
                totalPoints={castaway.scoreEvents.reduce((sum, e) => sum + e.points, 0)}
                isAdmin={isAdmin}
                tribeName={castaway.tribeId ? tribeNameById.get(castaway.tribeId) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
