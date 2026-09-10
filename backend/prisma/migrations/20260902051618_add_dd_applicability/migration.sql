-- CreateEnum
CREATE TYPE "DDApplicability" AS ENUM ('CORE', 'IF_APPLICABLE');

-- AlterTable
ALTER TABLE "DDChecklistItem" ADD COLUMN     "applicability" "DDApplicability" NOT NULL DEFAULT 'CORE';
