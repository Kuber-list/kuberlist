-- CreateEnum
CREATE TYPE "PortfolioMilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK');

-- CreateEnum
CREATE TYPE "PortfolioMilestonePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "PortfolioMessage" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioMilestone" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "target_date" TIMESTAMP(3),
    "priority" "PortfolioMilestonePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "PortfolioMilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioDocument" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioMilestoneDocument" (
    "id" TEXT NOT NULL,
    "milestone_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioMilestoneDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioMessage_investment_id_created_at_idx" ON "PortfolioMessage"("investment_id", "created_at");

-- CreateIndex
CREATE INDEX "PortfolioMessage_sender_id_idx" ON "PortfolioMessage"("sender_id");

-- CreateIndex
CREATE INDEX "PortfolioMilestone_investment_id_idx" ON "PortfolioMilestone"("investment_id");

-- CreateIndex
CREATE INDEX "PortfolioMilestone_created_by_idx" ON "PortfolioMilestone"("created_by");

-- CreateIndex
CREATE INDEX "PortfolioMilestone_status_idx" ON "PortfolioMilestone"("status");

-- CreateIndex
CREATE INDEX "PortfolioMilestone_target_date_idx" ON "PortfolioMilestone"("target_date");

-- CreateIndex
CREATE INDEX "PortfolioDocument_investment_id_idx" ON "PortfolioDocument"("investment_id");

-- CreateIndex
CREATE INDEX "PortfolioDocument_document_id_idx" ON "PortfolioDocument"("document_id");

-- CreateIndex
CREATE INDEX "PortfolioDocument_added_by_idx" ON "PortfolioDocument"("added_by");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioDocument_investment_id_document_id_key" ON "PortfolioDocument"("investment_id", "document_id");

-- CreateIndex
CREATE INDEX "PortfolioMilestoneDocument_milestone_id_idx" ON "PortfolioMilestoneDocument"("milestone_id");

-- CreateIndex
CREATE INDEX "PortfolioMilestoneDocument_document_id_idx" ON "PortfolioMilestoneDocument"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioMilestoneDocument_milestone_id_document_id_key" ON "PortfolioMilestoneDocument"("milestone_id", "document_id");

-- AddForeignKey
ALTER TABLE "PortfolioMessage" ADD CONSTRAINT "PortfolioMessage_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMessage" ADD CONSTRAINT "PortfolioMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMilestone" ADD CONSTRAINT "PortfolioMilestone_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMilestone" ADD CONSTRAINT "PortfolioMilestone_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioDocument" ADD CONSTRAINT "PortfolioDocument_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioDocument" ADD CONSTRAINT "PortfolioDocument_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioDocument" ADD CONSTRAINT "PortfolioDocument_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMilestoneDocument" ADD CONSTRAINT "PortfolioMilestoneDocument_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "PortfolioMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMilestoneDocument" ADD CONSTRAINT "PortfolioMilestoneDocument_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
