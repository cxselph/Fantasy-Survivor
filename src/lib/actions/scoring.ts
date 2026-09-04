"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getActiveSeason, pointsForChallenge, pointsForPlacement, pointsForTribal } from "@/lib/scoring";
import { resolveUploadedImage } from "@/lib/upload";
import { ScoreEventType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

function refresh() {
  revalidatePath("/");
  revalidatePath("/cast");
  revalidatePath("/join");
  revalidatePath("/admin/scoring");
  revalidatePath("/admin/cast");
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
  if (week > season.totalWeeks) {
    return {
      error: `Week ${week} is past this season's length (${season.totalWeeks} weeks). Raise it in Season Settings if this season is running long.`,
    };
  }

  const castaways = await prisma.castaway.findMany({ where: { seasonId: season.id } });

  const challengePoints = pointsForChallenge(season, week);
  const tribalPoints = pointsForTribal(season, week);

  await prisma.$transaction(async (tx) => {
    for (const castaway of castaways) {
      // Once we're past the week they were actually voted out in, their row is
      // disabled on the form (no fields submitted) and stays as-is. Weeks at or
      // before their boot remain editable, since they were genuinely still in.
      const isOutForThisWeek =
        castaway.isEliminated && (castaway.eliminatedWeek == null || week > castaway.eliminatedWeek);
      if (isOutForThisWeek) continue;

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

      // Reaching the finale (a placement) means they made it - not "voted out".
      // Otherwise, not surviving tribal this week means they were voted out this week.
      if (placement) {
        if (castaway.placement !== placement) {
          await tx.castaway.update({ where: { id: castaway.id }, data: { placement } });
        }
      } else if (!survivedTribal) {
        await tx.castaway.update({
          where: { id: castaway.id },
          data: { isEliminated: true, eliminatedWeek: week },
        });
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

/**
 * Wipes all scoring history for the active season: every score event, and every
 * castaway's elimination/placement status (which are derived from that scoring).
 * Leaves the cast list, tribes, and drafted teams untouched.
 */
export async function resetScoring() {
  await requireAdmin();
  const season = await getActiveSeason();

  await prisma.$transaction([
    prisma.scoreEvent.deleteMany({ where: { seasonId: season.id } }),
    prisma.castaway.updateMany({
      where: { seasonId: season.id },
      data: { isEliminated: false, eliminatedWeek: null, placement: null },
    }),
  ]);

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
  const totalWeeksRaw = String(formData.get("totalWeeks") || "").trim();
  const totalWeeks = totalWeeksRaw ? Number(totalWeeksRaw) : 13;
  const removeBanner = formData.get("removeBanner") === "on";
  const removeBackground = formData.get("removeBackground") === "on";
  const siteTitle = String(formData.get("siteTitle") || "").trim();
  const backgroundDimRaw = String(formData.get("backgroundDim") || "").trim();
  const backgroundDim = backgroundDimRaw ? Number(backgroundDimRaw) : 45;
  const accentColorRaw = String(formData.get("accentColor") || "").trim();

  if (!Number.isInteger(totalWeeks) || totalWeeks < 1) {
    return { error: "Season length must be a whole number of weeks." };
  }
  if (!Number.isInteger(backgroundDim) || backgroundDim < 0 || backgroundDim > 100) {
    return { error: "Background darkness must be between 0 and 100." };
  }
  if (accentColorRaw && !/^#[0-9a-fA-F]{6}$/.test(accentColorRaw)) {
    return { error: "Theme color must be a valid hex color." };
  }

  const { url: bannerResolved, error: bannerError } = await resolveUploadedImage(
    formData,
    "bannerFile",
    "bannerUrl",
  );
  if (bannerError) return { error: bannerError };

  const { url: backgroundResolved, error: backgroundError } = await resolveUploadedImage(
    formData,
    "backgroundFile",
    "backgroundUrl",
  );
  if (backgroundError) return { error: backgroundError };

  const data: Prisma.SeasonUpdateInput = {
    draftLocked,
    mergeWeek,
    totalWeeks,
    siteTitle: siteTitle || null,
    backgroundDim,
    accentColor: accentColorRaw || null,
  };
  if (removeBanner) {
    data.bannerUrl = null;
  } else if (bannerResolved) {
    // Only touch bannerUrl when a new one was actually given - otherwise leave it
    // as-is, since this form is submitted every time any season setting changes.
    data.bannerUrl = bannerResolved;
  }
  if (removeBackground) {
    data.backgroundUrl = null;
  } else if (backgroundResolved) {
    data.backgroundUrl = backgroundResolved;
  }

  await prisma.season.update({ where: { id: seasonId }, data });

  revalidatePath("/");
  revalidatePath("/cast");
  revalidatePath("/rules");
  revalidatePath("/join");
  revalidatePath("/login");
  revalidatePath("/admin");
  revalidatePath("/admin/scoring");

  return { success: true };
}
