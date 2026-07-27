/*
  Warnings:

  - Added the required column `mime_type` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'CLOUDINARY');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD COLUMN     "original_file_name" TEXT,
ADD COLUMN     "public_id" TEXT,
ADD COLUMN     "storage_path" TEXT,
ADD COLUMN     "storage_provider" "StorageProvider" NOT NULL DEFAULT 'LOCAL',
ALTER COLUMN "visibility" SET DEFAULT 'INTERESTED_ONLY';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Document_startup_id_idx" ON "Document"("startup_id");

-- CreateIndex
CREATE INDEX "Document_visibility_idx" ON "Document"("visibility");

-- CreateIndex
CREATE INDEX "Document_startup_id_visibility_idx" ON "Document"("startup_id", "visibility");

-- CreateIndex
CREATE INDEX "Document_uploaded_at_idx" ON "Document"("uploaded_at");

-- CreateIndex
CREATE INDEX "Document_document_type_idx" ON "Document"("document_type");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_startup_id_idx" ON "DocumentAccessLog"("startup_id");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_investor_id_idx" ON "DocumentAccessLog"("investor_id");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_document_id_idx" ON "DocumentAccessLog"("document_id");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_viewed_at_idx" ON "DocumentAccessLog"("viewed_at");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");
