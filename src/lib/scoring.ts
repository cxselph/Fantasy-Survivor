import { prisma } from "@/lib/prisma";
import type { Season } from "@/generated/prisma/client";

export async function getActiveSeason() {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { number: "desc" },
  });
  if (!season) {
    throw new Error("No active season configured. Create one from the admin screen.");
  }
  return season;
}

export async function getAllSeasons() {
  return prisma.season.findMany({ orderBy: { number: "desc" } });
}

/**
 * Resolves a season for read-only viewing (Dashboard, Cast, Rules): a specific
 * `seasonNumber` if given and it exists, otherwise the active season.
 */
export async function getSeasonForView(seasonNumber?: number) {
  if (seasonNumber != null) {
    const season = await prisma.season.findUnique({ where: { number: seasonNumber } });
    if (season) return season;
  }
  return getActiveSeason();
}

export function getSiteTitle(season: Season) {
  return season.siteTitle?.trim() || `🔥 Survivor ${season.number} League`;
}

export function pointsForChallenge(season: Season, week: number) {
  const isPostMerge = season.mergeWeek != null && week >= season.mergeWeek;
  return isPostMerge ? season.challengeWinPostMerge : season.challengeWinPreMerge;
}

export function pointsForTribal(season: Season, week: number) {
  const isPostMerge = season.mergeWeek != null && week >= season.mergeWeek;
  return isPostMerge ? season.tribalSurvivePostMerge : season.tribalSurvivePreMerge;
}

export function pointsForPlacement(season: Season, placement: 1 | 2 | 3) {
  if (placement === 1) return season.firstPlacePoints;
  if (placement === 2) return season.secondPlacePoints;
  return season.thirdPlacePoints;
}

export async function getCastawaysWithPoints(seasonId: number) {
  const castaways = await prisma.castaway.findMany({
    where: { seasonId },
    include: { tribe: true, scoreEvents: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return castaways.map((castaway) => ({
    ...castaway,
    totalPoints: castaway.scoreEvents.reduce((sum, event) => sum + event.points, 0),
  }));
}

export type TeamPickSummary = {
  castawayId: number;
  name: string;
  isPowerPlayer: boolean;
  isEliminated: boolean;
  placement: number | null;
  castawayTotal: number;
  contribution: number;
  bonus: number;
};

export type TeamStanding = {
  teamId: number;
  ownerName: string;
  userId: number | null;
  total: number;
  picks: TeamPickSummary[];
};

export async function getStandings(seasonId: number): Promise<TeamStanding[]> {
  const season = await prisma.season.findUniqueOrThrow({ where: { id: seasonId } });
  const teams = await prisma.fantasyTeam.findMany({
    where: { seasonId },
    include: {
      picks: {
        include: { castaway: { include: { scoreEvents: true } } },
      },
    },
  });

  const standings = teams.map((team) => {
    let total = 0;
    const picks: TeamPickSummary[] = team.picks
      .map((pick) => {
        const castawayTotal = pick.castaway.scoreEvents.reduce((sum, e) => sum + e.points, 0);
        let contribution = castawayTotal;
        let bonus = 0;
        if (pick.isPowerPlayer) {
          contribution = castawayTotal * season.powerPlayerMultiplier;
          if (pick.castaway.placement === 1) {
            bonus = season.powerPlayerWinBonus;
            contribution += bonus;
          }
        }
        total += contribution;
        return {
          castawayId: pick.castawayId,
          name: pick.castaway.name,
          isPowerPlayer: pick.isPowerPlayer,
          isEliminated: pick.castaway.isEliminated,
          placement: pick.castaway.placement,
          castawayTotal,
          contribution,
          bonus,
        };
      })
      .sort((a, b) => Number(b.isPowerPlayer) - Number(a.isPowerPlayer) || b.contribution - a.contribution);

    return { teamId: team.id, ownerName: team.ownerName, userId: team.userId, total, picks };
  });

  standings.sort((a, b) => b.total - a.total);
  return standings;
}
