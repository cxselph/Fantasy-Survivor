import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlockTeam, unlinkTeamUser } from "@/lib/actions/team";
import { JoinForm } from "@/app/join/join-form";
import { DeleteTeamButton } from "../delete-team-button";
import { LinkTeamUserForm } from "../link-team-user-form";

export default async function AdminTeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ reveal?: string }>;
}) {
  const session = await requireAdmin();
  const { teamId: teamIdParam } = await params;
  const teamId = Number(teamIdParam);
  const { reveal } = await searchParams;

  const team = await prisma.fantasyTeam.findUnique({
    where: { id: teamId },
    include: { picks: true, user: true, season: true },
  });
  if (!team) notFound();

  const isMine = team.userId === session.userId;
  const shouldHide = team.season.hideTeamsUntilLocked && !team.season.draftLocked;
  const picksHidden = shouldHide && !isMine && reveal !== "1";

  const castaways = await prisma.castaway.findMany({
    where: { seasonId: team.seasonId },
    orderBy: [{ isEliminated: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const displayName = team.user?.name ?? team.ownerName;

  const linkCandidates = team.user
    ? []
    : await prisma.user.findMany({
        where: { passwordHash: { not: null }, teams: { none: { seasonId: team.seasonId } } },
        orderBy: { name: "asc" },
      });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm">
        <h1 className="font-display text-3xl tracking-wide text-neutral-900">{displayName}&apos;s Team</h1>
        <p className="text-sm text-neutral-500">Season {team.season.number}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-neutral-600">
            Linked to: {team.user ? `${team.user.name} (${team.user.email})` : "no account (unclaimed)"}
          </span>
          {team.user && (
            <form action={unlinkTeamUser.bind(null, team.id)}>
              <button type="submit" className="text-accent-700 underline hover:no-underline">
                Unlink
              </button>
            </form>
          )}
        </div>

        {!team.user && (
          <div className="mt-2">
            <LinkTeamUserForm teamId={team.id} candidates={linkCandidates} />
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {team.locked && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <span>🔒 Locked in.</span>
              <form action={unlockTeam.bind(null, team.id)}>
                <button type="submit" className="font-semibold underline hover:no-underline">
                  Unlock it
                </button>
              </form>
            </div>
          )}
          <DeleteTeamButton teamId={team.id} ownerName={displayName} />
        </div>
      </div>

      {picksHidden ? (
        <div className="rounded-2xl bg-white/90 p-5 text-sm text-neutral-600 shadow-lg backdrop-blur-sm">
          🔒 This team&apos;s picks are hidden until the draft locks.{" "}
          <Link href={`/admin/teams/${team.id}?reveal=1`} className="font-medium text-accent-700 underline">
            View and edit anyway (admin override)
          </Link>
        </div>
      ) : (
        <JoinForm
          key={team.id}
          castaways={castaways}
          selectedIds={team.picks.map((p) => p.castawayId)}
          powerPlayerId={team.picks.find((p) => p.isPowerPlayer)?.castawayId ?? null}
          alreadyLocked={team.locked}
          teamId={team.id}
        />
      )}
    </div>
  );
}
