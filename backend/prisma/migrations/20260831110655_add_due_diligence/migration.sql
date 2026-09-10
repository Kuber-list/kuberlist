-- CreateEnum
CREATE TYPE "DueDiligenceStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DDRequirementStatus" AS ENUM ('MISSING', 'REQUESTED', 'UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "DDVerificationLevel" AS ENUM ('NONE', 'UPLOADED', 'KUBERLIST_VERIFIED', 'THIRD_PARTY_VERIFIED');

-- CreateEnum
CREATE TYPE "DDCategory" AS ENUM ('CORPORATE', 'FINANCIAL', 'OWNERSHIP', 'LEGAL', 'TAX', 'COMMERCIAL', 'BUSINESS', 'OTHER');

-- CreateTable
CREATE TABLE "DDChecklistTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" "EntityType" NOT NULL DEFAULT 'STARTUP',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DDChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DDChecklistItem" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "category" "DDCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DDChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDiligence" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "template_id" TEXT,
    "status" "DueDiligenceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "readiness_score" INTEGER NOT NULL DEFAULT 0,
    "verification_score" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DueDiligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DDRequirement" (
    "id" TEXT NOT NULL,
    "due_diligence_id" TEXT NOT NULL,
    "checklist_item_id" TEXT NOT NULL,
    "status" "DDRequirementStatus" NOT NULL DEFAULT 'MISSING',
    "verification_level" "DDVerificationLevel" NOT NULL DEFAULT 'NONE',
    "document_id" TEXT,
    "diligence_request_id" TEXT,
    "verification_notes" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DDRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DDChecklistItem_template_id_idx" ON "DDChecklistItem"("template_id");

-- CreateIndex
CREATE INDEX "DDChecklistItem_category_idx" ON "DDChecklistItem"("category");

-- CreateIndex
CREATE UNIQUE INDEX "DueDiligence_connection_id_key" ON "DueDiligence"("connection_id");

-- CreateIndex
CREATE INDEX "DueDiligence_status_idx" ON "DueDiligence"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DDRequirement_diligence_request_id_key" ON "DDRequirement"("diligence_request_id");

-- CreateIndex
CREATE INDEX "DDRequirement_due_diligence_id_idx" ON "DDRequirement"("due_diligence_id");

-- CreateIndex
CREATE INDEX "DDRequirement_checklist_item_id_idx" ON "DDRequirement"("checklist_item_id");

-- CreateIndex
CREATE INDEX "DDRequirement_status_idx" ON "DDRequirement"("status");

-- CreateIndex
CREATE INDEX "DDRequirement_verification_level_idx" ON "DDRequirement"("verification_level");

-- CreateIndex
CREATE INDEX "DDRequirement_document_id_idx" ON "DDRequirement"("document_id");

-- AddForeignKey
ALTER TABLE "DDChecklistItem" ADD CONSTRAINT "DDChecklistItem_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "DDChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDiligence" ADD CONSTRAINT "DueDiligence_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDiligence" ADD CONSTRAINT "DueDiligence_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "DDChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DDRequirement" ADD CONSTRAINT "DDRequirement_due_diligence_id_fkey" FOREIGN KEY ("due_diligence_id") REFERENCES "DueDiligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DDRequirement" ADD CONSTRAINT "DDRequirement_checklist_item_id_fkey" FOREIGN KEY ("checklist_item_id") REFERENCES "DDChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DDRequirement" ADD CONSTRAINT "DDRequirement_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DDRequirement" ADD CONSTRAINT "DDRequirement_diligence_request_id_fkey" FOREIGN KEY ("diligence_request_id") REFERENCES "DiligenceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
