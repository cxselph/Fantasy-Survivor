import { getSession } from "@/lib/auth";
import { getActiveSeason } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { CastawayCard } from "./castaway-card";

export default async function CastPage() {
  const session = await getSession();
  const season = await getActiveSeason();

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

  const isAdmin = session?.role === "admin";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">The Cast</h1>
        <p className="text-sm text-neutral-500">
          Season {season.number}: {season.name}
        </p>
      </div>

      {groups.map(({ tribe, castaways: members }) => (
        <div key={tribe?.id ?? "unassigned"}>
          <h2
            className="mb-3 inline-block rounded-md px-3 py-1 text-sm font-bold uppercase tracking-wide text-white"
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
