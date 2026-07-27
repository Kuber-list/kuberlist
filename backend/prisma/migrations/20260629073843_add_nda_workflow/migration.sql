-- AlterTable
ALTER TABLE "Connection" ADD COLUMN     "nda_document_id" TEXT,
ADD COLUMN     "nda_executed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nda_executed_at" TIMESTAMP(3),
ADD COLUMN     "nda_overridden_at" TIMESTAMP(3),
ADD COLUMN     "nda_overridden_by" TEXT,
ADD COLUMN     "nda_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nda_requirement_overridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nda_uploaded_by" TEXT;

-- AlterTable
ALTER TABLE "StartupListing" ADD COLUMN     "requires_nda" BOOLEAN NOT NULL DEFAULT false;
