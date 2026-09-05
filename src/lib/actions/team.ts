"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth";
import { getActiveSeason, isDraftLocked } from "@/lib/scoring";

export type SaveTeamState = { error?: string };

export async function saveTeam(
  _prevState: SaveTeamState | undefined,
  formData: FormData,
): Promise<SaveTeamState> {
  const session = await requireSession();
  const isAdmin = session.role === "admin";

  // Only meaningful for admins editing someone else's team from Admin -> Teams; a regular
  // member's team is always their own, derived from the session, never from form input.
  const adminTeamId = isAdmin && formData.get("teamId") ? Number(formData.get("teamId")) : null;

  const castawayIds = formData
    .getAll("castawayIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
  const powerPlayerId = Number(formData.get("powerPlayerId"));

  if (castawayIds.length !== 5) {
    return { error: `Pick exactly 5 castaways (you picked ${castawayIds.length}).` };
  }
  if (!castawayIds.includes(powerPlayerId)) {
    return { error: "Your Power Player must be one of your 5 picks." };
  }

  const season = await getActiveSeason();

  if (isDraftLocked(season) && !isAdmin) {
    return { error: "The draft is locked for this season — picks can no longer be changed." };
  }

  let team;
  if (adminTeamId) {
    team = await prisma.fantasyTeam.findUnique({ where: { id: adminTeamId } });
    if (!team) return { error: "Team not found." };
  } else {
    const existing = await prisma.fantasyTeam.findUnique({
      where: { seasonId_userId: { seasonId: season.id, userId: session.userId } },
    });
    if (existing?.locked && !isAdmin) {
      return { error: "This team is locked in. Ask an admin to unlock it if you need to make a change." };
    }
    team =
      existing ??
      (await prisma.fantasyTeam.create({
        data: { seasonId: season.id, userId: session.userId, ownerName: session.name },
      }));
  }

  const wantsLock = formData.get("lockTeam") === "on";
  await prisma.$transaction([
    prisma.teamPick.deleteMany({ where: { teamId: team.id } }),
    prisma.teamPick.createMany({
      data: castawayIds.map((castawayId) => ({
        teamId: team.id,
        castawayId,
        isPowerPlayer: castawayId === powerPlayerId,
      })),
    }),
    // Locking only ever turns on here - unlocking is an admin-only action.
    ...(wantsLock ? [prisma.fantasyTeam.update({ where: { id: team.id }, data: { locked: true } })] : []),
  ]);

  revalidatePath("/");

  if (adminTeamId) {
    redirect(`/admin/teams/${adminTeamId}`);
  }
  redirect("/join");
}

export async function unlockTeam(teamId: number) {
  await requireAdmin();
  await prisma.fantasyTeam.update({ where: { id: teamId }, data: { locked: false } });
  revalidatePath("/join");
  revalidatePath("/admin/teams");
}

export async function deleteTeam(teamId: number) {
  await requireAdmin();
  // Cascades to the team's picks; doesn't touch the cast list or other teams.
  await prisma.fantasyTeam.delete({ where: { id: teamId } });
  revalidatePath("/");
  redirect("/admin/teams");
}

export async function unlinkTeamUser(teamId: number) {
  await requireAdmin();
  await prisma.fantasyTeam.update({ where: { id: teamId }, data: { userId: null } });
  revalidatePath("/admin/teams");
}

export type LinkTeamUserState = { error?: string };

export async function linkTeamUser(
  teamId: number,
  _prevState: LinkTeamUserState | undefined,
  formData: FormData,
): Promise<LinkTeamUserState> {
  await requireAdmin();

  const userId = Number(formData.get("userId"));
  if (!Number.isInteger(userId)) {
    return { error: "Choose a user to link." };
  }

  const team = await prisma.fantasyTeam.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Team not found." };

  const clash = await prisma.fantasyTeam.findUnique({
    where: { seasonId_userId: { seasonId: team.seasonId, userId } },
  });
  if (clash) {
    return { error: "That user already has a team this season." };
  }

  await prisma.fantasyTeam.update({ where: { id: teamId }, data: { userId } });
  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${teamId}`);
  return {};
}
