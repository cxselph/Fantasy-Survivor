import Link from "next/link";
import { getActiveSeason } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { JoinForm } from "./join-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner } = await searchParams;
  const session = await getSession();
  const season = await getActiveSeason();

  const [castaways, teams] = await Promise.all([
    prisma.castaway.findMany({
      where: { seasonId: season.id },
      orderBy: [{ isEliminated: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.fantasyTeam.findMany({
      where: { seasonId: season.id },
      include: { picks: true },
      orderBy: { ownerName: "asc" },
    }),
  ]);

  const existingTeam = owner ? teams.find((t) => t.ownerName === owner) : undefined;
  const locked = season.draftLocked && session?.role !== "admin";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">My Team</h1>
        <p className="text-sm text-neutral-500">
          Pick 5 castaways and mark one as your Power Player (scores double, plus a bonus if they win it all).
        </p>
        {locked && (
          <p className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            The draft is locked for Season {season.number} — picks can no longer be changed.
          </p>
        )}
        {owner && existingTeam && (
          <p className="mt-2 text-sm text-green-700">✓ Showing {existingTeam.ownerName}&apos;s saved team.</p>
        )}
      </div>

      {teams.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-neutral-500">Edit an existing team:</span>
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/join?owner=${encodeURIComponent(team.ownerName)}`}
              className={`rounded-full border px-3 py-1 ${
                team.ownerName === owner
                  ? "border-orange-600 bg-orange-50 text-orange-700"
                  : "border-neutral-200 text-neutral-600 hover:border-orange-300"
              }`}
            >
              {team.ownerName}
            </Link>
          ))}
        </div>
      )}

      <JoinForm
        castaways={castaways}
        ownerName={existingTeam?.ownerName ?? ""}
        selectedIds={existingTeam?.picks.map((p) => p.castawayId) ?? []}
        powerPlayerId={existingTeam?.picks.find((p) => p.isPowerPlayer)?.castawayId ?? null}
        locked={locked}
      />
    </div>
  );
}
