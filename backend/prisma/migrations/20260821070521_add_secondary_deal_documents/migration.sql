-- CreateEnum
CREATE TYPE "SecondaryDocumentRequestStatus" AS ENUM ('REQUESTED', 'FULFILLED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SecondaryDealDocument" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_file_name" TEXT,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'LOCAL',
    "file_url" TEXT NOT NULL,
    "public_id" TEXT,
    "mime_type" TEXT NOT NULL,
    "storage_path" TEXT,
    "file_size" INTEGER,
    "document_type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecondaryDealDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecondaryDealDocumentRequest" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_from" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SecondaryDocumentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "SecondaryDealDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecondaryDealDocument_deal_id_idx" ON "SecondaryDealDocument"("deal_id");

-- CreateIndex
CREATE INDEX "SecondaryDealDocument_uploaded_by_idx" ON "SecondaryDealDocument"("uploaded_by");

-- CreateIndex
CREATE INDEX "SecondaryDealDocument_uploaded_at_idx" ON "SecondaryDealDocument"("uploaded_at");

-- CreateIndex
CREATE INDEX "SecondaryDealDocumentRequest_deal_id_idx" ON "SecondaryDealDocumentRequest"("deal_id");

-- CreateIndex
CREATE INDEX "SecondaryDealDocumentRequest_requested_by_idx" ON "SecondaryDealDocumentRequest"("requested_by");

-- CreateIndex
CREATE INDEX "SecondaryDealDocumentRequest_requested_from_idx" ON "SecondaryDealDocumentRequest"("requested_from");

-- CreateIndex
CREATE INDEX "SecondaryDealDocumentRequest_status_idx" ON "SecondaryDealDocumentRequest"("status");

-- AddForeignKey
ALTER TABLE "SecondaryDealDocument" ADD CONSTRAINT "SecondaryDealDocument_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "SecondaryDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDealDocument" ADD CONSTRAINT "SecondaryDealDocument_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDealDocumentRequest" ADD CONSTRAINT "SecondaryDealDocumentRequest_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "SecondaryDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDealDocumentRequest" ADD CONSTRAINT "SecondaryDealDocumentRequest_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDealDocumentRequest" ADD CONSTRAINT "SecondaryDealDocumentRequest_requested_from_fkey" FOREIGN KEY ("requested_from") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDealDocumentRequest" ADD CONSTRAINT "SecondaryDealDocumentRequest_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "SecondaryDealDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
