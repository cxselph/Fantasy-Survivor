import { getActiveSeason } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { unlockTeam } from "@/lib/actions/team";
import { NoSeasonYet } from "@/components/no-season-yet";
import { JoinForm } from "./join-form";
import { TeamSwitcher } from "./team-switcher";
import { DeleteTeamButton } from "./delete-team-button";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner } = await searchParams;
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  let season;
  try {
    season = await getActiveSeason();
  } catch {
    return <NoSeasonYet isAdmin={isAdmin} />;
  }

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
      <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h1 className="font-display text-3xl tracking-wide text-neutral-900">My Team</h1>
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
          <div className="mt-2 flex items-center gap-3">
            <p className="text-sm text-green-700">✓ Showing {existingTeam.ownerName}&apos;s saved team.</p>
            {isAdmin && <DeleteTeamButton teamId={existingTeam.id} ownerName={existingTeam.ownerName} />}
          </div>
        )}
      </div>

      {teams.length > 0 && <TeamSwitcher teams={teams} currentOwner={owner} />}

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
