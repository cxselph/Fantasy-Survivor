import { getSession } from "@/lib/auth";
import { getAllSeasons, getSeasonForView } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { SeasonSwitcher } from "@/components/season-switcher";
import { CastawayCard } from "./castaway-card";

export default async function CastPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;
  const session = await getSession();
  const [season, allSeasons] = await Promise.all([
    getSeasonForView(seasonParam ? Number(seasonParam) : undefined),
    getAllSeasons(),
  ]);

  const [tribes, castaways] = await Promise.all([
    prisma.tribe.findMany({ where: { seasonId: season.id }, orderBy: { name: "asc" } }),
    prisma.castaway.findMany({
      where: { seasonId: season.id },
      include: { scoreEvents: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const groups = [
    ...tribes.map((tribe) => ({
      tribe,
      castaways: castaways.filter((c) => c.tribeId === tribe.id),
    })),
    { tribe: null, castaways: castaways.filter((c) => c.tribeId === null) },
  ].filter((group) => group.castaways.length > 0);

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

      {groups.map(({ tribe, castaways: members }) => (
        <div key={tribe?.id ?? "unassigned"}>
          <h2
            className="font-display mb-3 block w-full rounded-xl px-4 py-4 text-center text-2xl tracking-wide text-white shadow-lg"
            style={{ backgroundColor: tribe?.color ?? "#737373" }}
          >
            {tribe?.name ?? "Tribe TBD"}
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
    </div>
  );
}
