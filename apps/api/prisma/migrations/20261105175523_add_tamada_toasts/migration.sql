-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Toast" (
    "id" TEXT NOT NULL,
    "conceptKey" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🍷',
    "titleKa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyKa" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Toast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToast" (
    "userId" TEXT NOT NULL,
    "toastId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserToast_pkey" PRIMARY KEY ("userId","toastId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Toast_conceptKey_key" ON "Toast"("conceptKey");

-- AddForeignKey
ALTER TABLE "UserToast" ADD CONSTRAINT "UserToast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToast" ADD CONSTRAINT "UserToast_toastId_fkey" FOREIGN KEY ("toastId") REFERENCES "Toast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
