"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isSeasonBackup, isScoreEventType, type SeasonBackup } from "@/lib/season-backup";

export type FormState = { error?: string };

function refresh() {
  revalidatePath("/");
  revalidatePath("/cast");
  revalidatePath("/rules");
  revalidatePath("/join");
  revalidatePath("/admin");
  revalidatePath("/admin/seasons");
  revalidatePath("/admin/cast");
  revalidatePath("/admin/scoring");
}

export async function createSeason(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const number = Number(formData.get("number"));
  const name = String(formData.get("name") || "").trim();

  if (!Number.isInteger(number) || number < 1) {
    return { error: "Enter a valid season number." };
  }
  if (!name) {
    return { error: "Enter a season name." };
  }

  try {
    // New seasons start inactive - the commissioner activates one explicitly
    // when it's time, so nothing switches over mid-setup by accident.
    await prisma.season.create({ data: { number, name, isActive: false } });
  } catch {
    return { error: `Season ${number} already exists.` };
  }

  refresh();
  return {};
}

export async function activateSeason(seasonId: number) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.season.updateMany({ data: { isActive: false }, where: {} }),
    prisma.season.update({ where: { id: seasonId }, data: { isActive: true } }),
  ]);
  refresh();
}

export async function updateSeasonInfo(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const seasonId = Number(formData.get("seasonId"));
  const number = Number(formData.get("number"));
  const name = String(formData.get("name") || "").trim();

  if (!Number.isInteger(number) || number < 1) {
    return { error: "Enter a valid season number." };
  }
  if (!name) {
    return { error: "Enter a season name." };
  }

  try {
    await prisma.season.update({ where: { id: seasonId }, data: { number, name } });
  } catch {
    return { error: `Season ${number} already exists.` };
  }

  refresh();
  return {};
}

export async function deleteSeason(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const seasonId = Number(formData.get("seasonId"));

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) return { error: "Season not found." };
  if (season.isActive) {
    return { error: "Can't delete the current season - activate a different one first." };
  }

  // Cascades to that season's tribes, castaways, teams, picks, and score events.
  await prisma.season.delete({ where: { id: seasonId } });

  refresh();
  return {};
}

export type RestoreState = { error?: string; success?: string };

// Recreates a season from a backup file (see src/lib/season-backup.ts). Every reference in the
// file is by name, not raw id, so this always creates a brand-new Season - it never touches or
// merges into an existing one. A team's account link is best-effort: restored by matching
// userEmail against the current User table, left unclaimed if no match (never creates a User).
export async function restoreSeason(
  _prevState: RestoreState | undefined,
  formData: FormData,
): Promise<RestoreState> {
  await requireAdmin();

  const file = formData.get("backupFile");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a backup file." };
  }

  let backup: SeasonBackup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    return { error: "That file isn't valid JSON." };
  }
  if (!isSeasonBackup(backup)) {
    return { error: "That doesn't look like a season backup file." };
  }

  const existing = await prisma.season.findUnique({ where: { number: backup.season.number } });
  if (existing) {
    return { error: `Season ${backup.season.number} already exists - delete or renumber it first.` };
  }

  await prisma.$transaction(
    async (tx) => {
      // New seasons start inactive, same as createSeason() - restoring never silently switches
      // what everyone sees.
      const season = await tx.season.create({ data: { ...backup.season, isActive: false } });

      const tribeIdByName = new Map<string, number>();
      for (const t of backup.tribes) {
        const tribe = await tx.tribe.create({ data: { seasonId: season.id, name: t.name, color: t.color } });
        tribeIdByName.set(t.name, tribe.id);
      }

      const castawayIdByName = new Map<string, number>();
      for (const c of backup.castaways) {
        const castaway = await tx.castaway.create({
          data: {
            seasonId: season.id,
            name: c.name,
            bio: c.bio,
            photoUrl: c.photoUrl,
            tribeId: c.tribeName ? (tribeIdByName.get(c.tribeName) ?? null) : null,
            sortOrder: c.sortOrder,
            isEliminated: c.isEliminated,
            eliminatedWeek: c.eliminatedWeek,
            placement: c.placement,
          },
        });
        castawayIdByName.set(c.name, castaway.id);
      }

      for (const t of backup.teams) {
        const user = t.userEmail ? await tx.user.findUnique({ where: { email: t.userEmail } }) : null;
        const team = await tx.fantasyTeam.create({
          data: { seasonId: season.id, ownerName: t.ownerName, userId: user?.id ?? null, locked: t.locked },
        });
        for (const p of t.picks) {
          const castawayId = castawayIdByName.get(p.castawayName);
          if (!castawayId) continue; // referenced a castaway not present in this backup - skip it
          await tx.teamPick.create({ data: { teamId: team.id, castawayId, isPowerPlayer: p.isPowerPlayer } });
        }
      }

      for (const e of backup.scoreEvents) {
        const castawayId = castawayIdByName.get(e.castawayName);
        if (!castawayId || !isScoreEventType(e.type)) continue;
        await tx.scoreEvent.create({
          data: { seasonId: season.id, castawayId, week: e.week, type: e.type, label: e.label, points: e.points },
        });
      }
    },
    { timeout: 30_000 },
  );

  refresh();
  return { success: `Season ${backup.season.number} restored.` };
}
