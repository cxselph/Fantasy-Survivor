-- CreateEnum
CREATE TYPE "ScoreEventType" AS ENUM ('CHALLENGE_WIN', 'TRIBAL_SURVIVE', 'FINAL_PLACEMENT', 'CUSTOM');

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "draftLocked" BOOLEAN NOT NULL DEFAULT false,
    "mergeWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challengeWinPreMerge" INTEGER NOT NULL DEFAULT 2,
    "tribalSurvivePreMerge" INTEGER NOT NULL DEFAULT 1,
    "challengeWinPostMerge" INTEGER NOT NULL DEFAULT 5,
    "tribalSurvivePostMerge" INTEGER NOT NULL DEFAULT 2,
    "firstPlacePoints" INTEGER NOT NULL DEFAULT 10,
    "secondPlacePoints" INTEGER NOT NULL DEFAULT 5,
    "thirdPlacePoints" INTEGER NOT NULL DEFAULT 3,
    "powerPlayerMultiplier" INTEGER NOT NULL DEFAULT 2,
    "powerPlayerWinBonus" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tribe" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',

    CONSTRAINT "Tribe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Castaway" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "tribeId" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,
    "eliminatedWeek" INTEGER,
    "placement" INTEGER,

    CONSTRAINT "Castaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyTeam" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "ownerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPick" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "castawayId" INTEGER NOT NULL,
    "isPowerPlayer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreEvent" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "castawayId" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "type" "ScoreEventType" NOT NULL,
    "label" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_number_key" ON "Season"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Tribe_seasonId_name_key" ON "Tribe"("seasonId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Castaway_seasonId_name_key" ON "Castaway"("seasonId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTeam_seasonId_ownerName_key" ON "FantasyTeam"("seasonId", "ownerName");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPick_teamId_castawayId_key" ON "TeamPick"("teamId", "castawayId");

-- AddForeignKey
ALTER TABLE "Tribe" ADD CONSTRAINT "Tribe_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Castaway" ADD CONSTRAINT "Castaway_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Castaway" ADD CONSTRAINT "Castaway_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "Tribe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTeam" ADD CONSTRAINT "FantasyTeam_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPick" ADD CONSTRAINT "TeamPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPick" ADD CONSTRAINT "TeamPick_castawayId_fkey" FOREIGN KEY ("castawayId") REFERENCES "Castaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreEvent" ADD CONSTRAINT "ScoreEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreEvent" ADD CONSTRAINT "ScoreEvent_castawayId_fkey" FOREIGN KEY ("castawayId") REFERENCES "Castaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
