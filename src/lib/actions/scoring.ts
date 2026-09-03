"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getActiveSeason, pointsForChallenge, pointsForPlacement, pointsForTribal } from "@/lib/scoring";
import { ScoreEventType } from "@/generated/prisma/enums";

function refresh() {
  revalidatePath("/");
  revalidatePath("/cast");
  revalidatePath("/admin/scoring");
}

export type FormState = { error?: string; success?: boolean };

export async function saveWeeklyResults(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const week = Number(formData.get("week"));
  if (!Number.isInteger(week) || week < 1) {
    return { error: "Enter a valid week number." };
  }

  const season = await getActiveSeason();
  const castaways = await prisma.castaway.findMany({ where: { seasonId: season.id } });

  const challengePoints = pointsForChallenge(season, week);
  const tribalPoints = pointsForTribal(season, week);

  await prisma.$transaction(async (tx) => {
    for (const castaway of castaways) {
      await tx.scoreEvent.deleteMany({
        where: {
          castawayId: castaway.id,
          week,
          type: { in: [ScoreEventType.CHALLENGE_WIN, ScoreEventType.TRIBAL_SURVIVE, ScoreEventType.FINAL_PLACEMENT] },
        },
      });

      const wonChallenge = formData.get(`challenge_${castaway.id}`) === "on";
      const survivedTribal = formData.get(`tribal_${castaway.id}`) === "on";
      const placementRaw = formData.get(`placement_${castaway.id}`);
      const placement = placementRaw ? (Number(placementRaw) as 1 | 2 | 3) : null;

      const events: { type: ScoreEventType; points: number; label: string }[] = [];
      if (wonChallenge) {
        events.push({ type: ScoreEventType.CHALLENGE_WIN, points: challengePoints, label: `Won challenge (Week ${week})` });
      }
      if (survivedTribal) {
        events.push({ type: ScoreEventType.TRIBAL_SURVIVE, points: tribalPoints, label: `Survived tribal (Week ${week})` });
      }
      if (placement) {
        const label = placement === 1 ? "Sole Survivor" : placement === 2 ? "Runner-up" : "Third place";
        events.push({ type: ScoreEventType.FINAL_PLACEMENT, points: pointsForPlacement(season, placement), label });
      }

      if (events.length > 0) {
        await tx.scoreEvent.createMany({
          data: events.map((event) => ({
            seasonId: season.id,
            castawayId: castaway.id,
            week,
            ...event,
          })),
        });
      }

      if (placement && castaway.placement !== placement) {
        await tx.castaway.update({ where: { id: castaway.id }, data: { placement } });
      }
    }
  });

  refresh();
  return { success: true };
}

export async function addCustomAdjustment(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const castawayId = Number(formData.get("castawayId"));
  const week = Number(formData.get("week"));
  const points = Number(formData.get("points"));
  const label = String(formData.get("label") || "").trim();

  if (!castawayId || !Number.isInteger(week) || week < 1 || !Number.isFinite(points) || !label) {
    return { error: "Fill out castaway, week, points, and a label." };
  }

  const season = await getActiveSeason();
  await prisma.scoreEvent.create({
    data: { seasonId: season.id, castawayId, week, type: ScoreEventType.CUSTOM, points, label },
  });

  refresh();
  return { success: true };
}

export async function deleteScoreEvent(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await prisma.scoreEvent.delete({ where: { id } });
  refresh();
}

export async function updateSeasonSettings(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const seasonId = Number(formData.get("seasonId"));
  const draftLocked = formData.get("draftLocked") === "on";
  const mergeWeekRaw = String(formData.get("mergeWeek") || "").trim();
  const mergeWeek = mergeWeekRaw ? Number(mergeWeekRaw) : null;

  await prisma.season.update({
    where: { id: seasonId },
    data: { draftLocked, mergeWeek },
  });

  revalidatePath("/");
  revalidatePath("/join");
  revalidatePath("/admin");
  revalidatePath("/admin/scoring");

  return { success: true };
}
