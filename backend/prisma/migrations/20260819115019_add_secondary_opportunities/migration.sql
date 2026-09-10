-- CreateEnum
CREATE TYPE "SecondaryOpportunityStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'LIVE', 'IN_DISCUSSION', 'COMPLETED', 'WITHDRAWN', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SecondarySaleType" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PriceVisibility" AS ENUM ('PUBLIC', 'ON_REQUEST');

-- CreateEnum
CREATE TYPE "SecondaryInterestStatus" AS ENUM ('EXPRESSED', 'APPROVED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SecondaryDealStatus" AS ENUM ('IN_DISCUSSION', 'NEGOTIATING', 'AGREED', 'COMPLETED', 'FAILED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "SecondaryOpportunity" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "investment_id" TEXT,
    "listing_id" TEXT,
    "external_organization_id" TEXT,
    "instrument" "InvestmentInstrument" NOT NULL,
    "sale_type" "SecondarySaleType" NOT NULL,
    "ownership_percentage" DOUBLE PRECISION,
    "stake_description" TEXT,
    "asking_price" DOUBLE PRECISION NOT NULL,
    "price_visibility" "PriceVisibility" NOT NULL DEFAULT 'PUBLIC',
    "minimum_transaction_size" DOUBLE PRECISION,
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "status" "SecondaryOpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondaryOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecondaryInterest" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "SecondaryInterestStatus" NOT NULL DEFAULT 'EXPRESSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondaryInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecondaryDeal" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "secondary_interest_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "status" "SecondaryDealStatus" NOT NULL DEFAULT 'IN_DISCUSSION',
    "agreed_price" DOUBLE PRECISION,
    "agreed_stake_details" TEXT,
    "outcome_notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondaryDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecondaryMessage" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "read_by" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "message_type" TEXT NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecondaryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecondaryOpportunity_seller_id_idx" ON "SecondaryOpportunity"("seller_id");

-- CreateIndex
CREATE INDEX "SecondaryOpportunity_investment_id_idx" ON "SecondaryOpportunity"("investment_id");

-- CreateIndex
CREATE INDEX "SecondaryOpportunity_listing_id_idx" ON "SecondaryOpportunity"("listing_id");

-- CreateIndex
CREATE INDEX "SecondaryOpportunity_external_organization_id_idx" ON "SecondaryOpportunity"("external_organization_id");

-- CreateIndex
CREATE INDEX "SecondaryOpportunity_status_idx" ON "SecondaryOpportunity"("status");

-- CreateIndex
CREATE INDEX "SecondaryOpportunity_expires_at_idx" ON "SecondaryOpportunity"("expires_at");

-- CreateIndex
CREATE INDEX "SecondaryInterest_investor_id_idx" ON "SecondaryInterest"("investor_id");

-- CreateIndex
CREATE INDEX "SecondaryInterest_status_idx" ON "SecondaryInterest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecondaryInterest_opportunity_id_investor_id_key" ON "SecondaryInterest"("opportunity_id", "investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "SecondaryDeal_secondary_interest_id_key" ON "SecondaryDeal"("secondary_interest_id");

-- CreateIndex
CREATE INDEX "SecondaryDeal_opportunity_id_idx" ON "SecondaryDeal"("opportunity_id");

-- CreateIndex
CREATE INDEX "SecondaryDeal_seller_id_idx" ON "SecondaryDeal"("seller_id");

-- CreateIndex
CREATE INDEX "SecondaryDeal_buyer_id_idx" ON "SecondaryDeal"("buyer_id");

-- CreateIndex
CREATE INDEX "SecondaryDeal_status_idx" ON "SecondaryDeal"("status");

-- CreateIndex
CREATE INDEX "SecondaryMessage_deal_id_idx" ON "SecondaryMessage"("deal_id");

-- CreateIndex
CREATE INDEX "SecondaryMessage_sender_id_idx" ON "SecondaryMessage"("sender_id");

-- AddForeignKey
ALTER TABLE "SecondaryOpportunity" ADD CONSTRAINT "SecondaryOpportunity_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryOpportunity" ADD CONSTRAINT "SecondaryOpportunity_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryOpportunity" ADD CONSTRAINT "SecondaryOpportunity_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryOpportunity" ADD CONSTRAINT "SecondaryOpportunity_external_organization_id_fkey" FOREIGN KEY ("external_organization_id") REFERENCES "ExternalOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryInterest" ADD CONSTRAINT "SecondaryInterest_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "SecondaryOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryInterest" ADD CONSTRAINT "SecondaryInterest_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDeal" ADD CONSTRAINT "SecondaryDeal_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "SecondaryOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDeal" ADD CONSTRAINT "SecondaryDeal_secondary_interest_id_fkey" FOREIGN KEY ("secondary_interest_id") REFERENCES "SecondaryInterest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDeal" ADD CONSTRAINT "SecondaryDeal_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryDeal" ADD CONSTRAINT "SecondaryDeal_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryMessage" ADD CONSTRAINT "SecondaryMessage_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "SecondaryDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryMessage" ADD CONSTRAINT "SecondaryMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
