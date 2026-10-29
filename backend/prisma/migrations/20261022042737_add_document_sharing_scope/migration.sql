-- CreateEnum
CREATE TYPE "DocumentSharingScope" AS ENUM ('GENERAL', 'STANDARD_DD', 'INVESTOR_REQUEST');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "sharing_scope" "DocumentSharingScope" NOT NULL DEFAULT 'GENERAL';
