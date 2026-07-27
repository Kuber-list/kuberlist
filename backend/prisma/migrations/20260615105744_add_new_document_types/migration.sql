-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'PURCHASE_ORDER';
ALTER TYPE "DocumentType" ADD VALUE 'REVENUE_PROOF';
ALTER TYPE "DocumentType" ADD VALUE 'CUSTOMER_CONTRACT';
ALTER TYPE "DocumentType" ADD VALUE 'PATENT_CERTIFICATE';
ALTER TYPE "DocumentType" ADD VALUE 'ACCELERATOR_CERTIFICATE';
ALTER TYPE "DocumentType" ADD VALUE 'STARTUP_INDIA_CERTIFICATE';
