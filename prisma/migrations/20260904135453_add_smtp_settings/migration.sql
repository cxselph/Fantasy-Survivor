-- CreateTable
CREATE TABLE "SmtpSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "host" TEXT,
    "port" INTEGER,
    "username" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "passwordCiphertext" TEXT,
    "passwordIv" TEXT,
    "passwordAuthTag" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpSettings_pkey" PRIMARY KEY ("id")
);

