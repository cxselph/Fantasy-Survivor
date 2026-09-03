"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getActiveSeason } from "@/lib/scoring";

export type SaveTeamState = { error?: string };

export async function saveTeam(
  _prevState: SaveTeamState | undefined,
  formData: FormData,
): Promise<SaveTeamState> {
  const session = await requireSession();

  const ownerName = String(formData.get("ownerName") || "").trim();
  const castawayIds = formData
    .getAll("castawayIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
  const powerPlayerId = Number(formData.get("powerPlayerId"));

  if (!ownerName) {
    return { error: "Enter your name." };
  }
  if (castawayIds.length !== 5) {
    return { error: `Pick exactly 5 castaways (you picked ${castawayIds.length}).` };
  }
  if (!castawayIds.includes(powerPlayerId)) {
    return { error: "Your Power Player must be one of your 5 picks." };
  }

  const season = await getActiveSeason();

  if (season.draftLocked && session.role !== "admin") {
    return { error: "The draft is locked for this season — picks can no longer be changed." };
  }

  const existing = await prisma.fantasyTeam.findUnique({
    where: { seasonId_ownerName: { seasonId: season.id, ownerName } },
  });

  const team = existing
    ? existing
    : await prisma.fantasyTeam.create({ data: { seasonId: season.id, ownerName } });

  await prisma.$transaction([
    prisma.teamPick.deleteMany({ where: { teamId: team.id } }),
    prisma.teamPick.createMany({
      data: castawayIds.map((castawayId) => ({
        teamId: team.id,
        castawayId,
        isPowerPlayer: castawayId === powerPlayerId,
      })),
    }),
  ]);

  revalidatePath("/");

  redirect(`/join?owner=${encodeURIComponent(ownerName)}`);
}
