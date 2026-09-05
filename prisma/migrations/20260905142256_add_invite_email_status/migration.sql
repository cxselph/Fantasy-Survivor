-- CreateEnum
CREATE TYPE "InviteEmailStatus" AS ENUM ('SENT', 'FAILED', 'NOT_CONFIGURED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastInviteEmailAt" TIMESTAMP(3),
ADD COLUMN     "lastInviteEmailError" TEXT,
ADD COLUMN     "lastInviteEmailStatus" "InviteEmailStatus";
