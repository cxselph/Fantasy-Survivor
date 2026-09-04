import { getActiveSeason, getStandings } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { unlockTeam } from "@/lib/actions/team";
import { NoSeasonYet } from "@/components/no-season-yet";
import { JoinForm } from "./join-form";
import { TeamRoster } from "./team-roster";

export default async function JoinPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";

  let season;
  try {
    season = await getActiveSeason();
  } catch {
    return <NoSeasonYet isAdmin={isAdmin} />;
  }

  const [castaways, existingTeam] = await Promise.all([
    prisma.castaway.findMany({
      where: { seasonId: season.id },
      orderBy: [{ isEliminated: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.fantasyTeam.findUnique({
      where: { seasonId_userId: { seasonId: season.id, userId: session.userId } },
      include: { picks: true },
    }),
  ]);

  const seasonLocked = season.draftLocked;
  const teamLocked = existingTeam?.locked ?? false;
  // Once the draft is locked (season-wide, or this team locked itself in), picks can no longer
  // change for a regular participant.
  const isLockedForParticipant = (seasonLocked || teamLocked) && !isAdmin;

  const powerPlayerId = existingTeam?.picks.find((p) => p.isPowerPlayer)?.castawayId ?? null;
  const pickedCastaways = existingTeam
    ? existingTeam.picks
        .map((pick) => castaways.find((c) => c.id === pick.castawayId))
        .filter((c): c is (typeof castaways)[number] => c != null)
    : [];
  // Shown to everyone (admins included) once the draft's locked and there's a roster to show -
  // an admin who's also a participant should still get to see their own reveal, not just the
  // editable form their bypass would otherwise leave them stuck with.
  const showReveal = (seasonLocked || teamLocked) && pickedCastaways.length > 0;

  let pointsByCastawayId: Record<number, number> = {};
  let totalPoints = 0;
  if (showReveal && existingTeam) {
    const standings = await getStandings(season.id);
    const standing = standings.find((s) => s.teamId === existingTeam.id);
    if (standing) {
      totalPoints = standing.total;
      pointsByCastawayId = Object.fromEntries(standing.picks.map((p) => [p.castawayId, p.contribution]));
    }
  }

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
            <span>🔒 Locked in.</span>
            <form action={unlockTeam.bind(null, existingTeam!.id)}>
              <button type="submit" className="font-semibold underline hover:no-underline">
                Unlock it
              </button>
            </form>
          </div>
        )}
        {existingTeam && (
          <p className="mt-2 text-sm text-green-700">✓ Showing {session.name}&apos;s saved team.</p>
        )}
      </div>

      {showReveal && (
        <TeamRoster
          castaways={pickedCastaways}
          powerPlayerId={powerPlayerId}
          pointsByCastawayId={pointsByCastawayId}
          totalPoints={totalPoints}
        />
      )}

      {isLockedForParticipant && pickedCastaways.length === 0 && (
        <p className="rounded-2xl bg-white/90 p-5 text-sm text-neutral-500 shadow-lg backdrop-blur-sm">
          You didn&apos;t draft a team before the draft locked.
        </p>
      )}

      {showReveal && isAdmin && (
        <p className="rounded-2xl bg-white/90 px-4 py-2 text-xs text-neutral-500 shadow-lg backdrop-blur-sm">
          You can still edit below since you&apos;re the commissioner.
        </p>
      )}

      {(isAdmin || !isLockedForParticipant) && (
        <JoinForm
          key={existingTeam?.id ?? "new"}
          castaways={castaways}
          selectedIds={existingTeam?.picks.map((p) => p.castawayId) ?? []}
          powerPlayerId={powerPlayerId}
          alreadyLocked={teamLocked}
        />
      )}
    </div>
  );
}
