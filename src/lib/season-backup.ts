import { prisma } from "@/lib/prisma";
import { ScoreEventType } from "@/generated/prisma/enums";

// Self-contained export format: every cross-reference is by name, not raw id, so a restore
// always creates a brand-new Season (and Tribes/Castaways/Teams within it) rather than needing
// the original database's ids to still mean anything. That also makes a backup portable between
// databases (e.g. local dev <-> production).
export const SEASON_BACKUP_VERSION = 1;

export type SeasonBackup = {
  version: 1;
  exportedAt: string;
  season: {
    number: number;
    name: string;
    draftLocked: boolean;
    hideTeamsUntilLocked: boolean;
    autoLockEnabled: boolean;
    autoLockAt: string | null;
    autoLockTimezone: string | null;
    mergeWeek: number | null;
    totalWeeks: number;
    bannerUrl: string | null;
    backgroundUrl: string | null;
    backgroundDim: number;
    siteTitle: string | null;
    accentColor: string | null;
    challengeWinPreMerge: number;
    tribalSurvivePreMerge: number;
    challengeWinPostMerge: number;
    tribalSurvivePostMerge: number;
    firstPlacePoints: number;
    secondPlacePoints: number;
    thirdPlacePoints: number;
    powerPlayerMultiplier: number;
    powerPlayerWinBonus: number;
  };
  tribes: { name: string; color: string }[];
  castaways: {
    name: string;
    bio: string | null;
    photoUrl: string | null;
    tribeName: string | null;
    sortOrder: number;
    isEliminated: boolean;
    eliminatedWeek: number | null;
    placement: number | null;
  }[];
  teams: {
    ownerName: string;
    userEmail: string | null;
    locked: boolean;
    picks: { castawayName: string; isPowerPlayer: boolean }[];
  }[];
  scoreEvents: {
    castawayName: string;
    week: number;
    type: string;
    label: string;
    points: number;
  }[];
};

export async function buildSeasonBackup(seasonId: number): Promise<SeasonBackup | null> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      tribes: true,
      castaways: { include: { tribe: true } },
      teams: { include: { picks: { include: { castaway: true } }, user: true } },
      scoreEvents: { include: { castaway: true } },
    },
  });
  if (!season) return null;

  return {
    version: SEASON_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    season: {
      number: season.number,
      name: season.name,
      draftLocked: season.draftLocked,
      hideTeamsUntilLocked: season.hideTeamsUntilLocked,
      autoLockEnabled: season.autoLockEnabled,
      autoLockAt: season.autoLockAt?.toISOString() ?? null,
      autoLockTimezone: season.autoLockTimezone,
      mergeWeek: season.mergeWeek,
      totalWeeks: season.totalWeeks,
      bannerUrl: season.bannerUrl,
      backgroundUrl: season.backgroundUrl,
      backgroundDim: season.backgroundDim,
      siteTitle: season.siteTitle,
      accentColor: season.accentColor,
      challengeWinPreMerge: season.challengeWinPreMerge,
      tribalSurvivePreMerge: season.tribalSurvivePreMerge,
      challengeWinPostMerge: season.challengeWinPostMerge,
      tribalSurvivePostMerge: season.tribalSurvivePostMerge,
      firstPlacePoints: season.firstPlacePoints,
      secondPlacePoints: season.secondPlacePoints,
      thirdPlacePoints: season.thirdPlacePoints,
      powerPlayerMultiplier: season.powerPlayerMultiplier,
      powerPlayerWinBonus: season.powerPlayerWinBonus,
    },
    tribes: season.tribes.map((t) => ({ name: t.name, color: t.color })),
    castaways: season.castaways.map((c) => ({
      name: c.name,
      bio: c.bio,
      photoUrl: c.photoUrl,
      tribeName: c.tribe?.name ?? null,
      sortOrder: c.sortOrder,
      isEliminated: c.isEliminated,
      eliminatedWeek: c.eliminatedWeek,
      placement: c.placement,
    })),
    teams: season.teams.map((t) => ({
      ownerName: t.ownerName,
      userEmail: t.user?.email ?? null,
      locked: t.locked,
      picks: t.picks.map((p) => ({ castawayName: p.castaway.name, isPowerPlayer: p.isPowerPlayer })),
    })),
    scoreEvents: season.scoreEvents.map((e) => ({
      castawayName: e.castaway.name,
      week: e.week,
      type: e.type,
      label: e.label,
      points: e.points,
    })),
  };
}

export function isSeasonBackup(value: unknown): value is SeasonBackup {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === SEASON_BACKUP_VERSION &&
    !!v.season &&
    typeof v.season === "object" &&
    typeof (v.season as Record<string, unknown>).number === "number" &&
    Array.isArray(v.tribes) &&
    Array.isArray(v.castaways) &&
    Array.isArray(v.teams) &&
    Array.isArray(v.scoreEvents)
  );
}

export function isScoreEventType(value: string): value is (typeof ScoreEventType)[keyof typeof ScoreEventType] {
  return Object.values(ScoreEventType).includes(value as (typeof ScoreEventType)[keyof typeof ScoreEventType]);
}
