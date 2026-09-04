import Link from "next/link";
import { getActiveSeason } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { unlockTeam } from "@/lib/actions/team";
import { JoinForm } from "./join-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner } = await searchParams;
  const session = await getSession();
  const season = await getActiveSeason();
  const isAdmin = session?.role === "admin";

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
  const seasonLocked = season.draftLocked;
  const teamLocked = existingTeam?.locked ?? false;
  const locked = (seasonLocked || teamLocked) && !isAdmin;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">My Team</h1>
        <p className="text-sm text-neutral-500">
          Pick 5 castaways and mark one as your Power Player (scores double, plus a bonus if they win it all).
        </p>
        {seasonLocked && (
          <p className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            The draft is locked for Season {season.number} — picks can no longer be changed.
          </p>
        )}
        {!seasonLocked && teamLocked && !isAdmin && (
          <p className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            🔒 This team is locked in. Ask the commissioner to unlock it if you need to make a change.
          </p>
        )}
        {!seasonLocked && teamLocked && isAdmin && (
          <div className="mt-2 flex items-center gap-3 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <span>🔒 {existingTeam?.ownerName} locked this team in.</span>
            <form action={unlockTeam.bind(null, existingTeam!.id)}>
              <button type="submit" className="font-semibold underline hover:no-underline">
                Unlock it
              </button>
            </form>
          </div>
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
              {team.locked && "🔒 "}
              {team.ownerName}
            </Link>
          ))}
        </div>
      )}

      <JoinForm
        key={existingTeam?.id ?? owner ?? "new"}
        castaways={castaways}
        ownerName={existingTeam?.ownerName ?? ""}
        selectedIds={existingTeam?.picks.map((p) => p.castawayId) ?? []}
        powerPlayerId={existingTeam?.picks.find((p) => p.isPowerPlayer)?.castawayId ?? null}
        locked={locked}
        alreadyLocked={teamLocked}
      />
    </div>
  );
}
