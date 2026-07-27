-- CreateEnum
CREATE TYPE "DiligenceRequestStatus" AS ENUM ('REQUESTED', 'UPLOADED', 'UNDER_REVIEW', 'COMPLETED');

-- CreateTable
CREATE TABLE "DiligenceRequest" (
    "id" TEXT NOT NULL,
    "startup_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "notes" TEXT,
    "status" "DiligenceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "response_document_id" TEXT,

    CONSTRAINT "DiligenceRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiligenceRequest" ADD CONSTRAINT "DiligenceRequest_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "StartupListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiligenceRequest" ADD CONSTRAINT "DiligenceRequest_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiligenceRequest" ADD CONSTRAINT "DiligenceRequest_response_document_id_fkey" FOREIGN KEY ("response_document_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
