-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UPLOADED', 'THIRD_PARTY_VERIFIED', 'KUBERLIST_REVIEWED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "verification_notes" TEXT,
ADD COLUMN     "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UPLOADED',
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" TEXT;
