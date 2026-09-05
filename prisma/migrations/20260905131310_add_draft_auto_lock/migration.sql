-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "autoLockAt" TIMESTAMP(3),
ADD COLUMN     "autoLockEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoLockTimezone" TEXT;
