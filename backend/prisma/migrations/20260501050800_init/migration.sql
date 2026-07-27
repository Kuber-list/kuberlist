-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CAPITAL_SEEKER', 'INVESTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('STARTUP', 'SME', 'BOTH');

-- CreateEnum
CREATE TYPE "InvestorCategory" AS ENUM ('MICRO_INVESTOR', 'ANGEL', 'SYNDICATE_LEAD', 'MICRO_VC', 'VC_FUND', 'FAMILY_OFFICE', 'CORPORATE');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "InterestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PITCH_DECK', 'FINANCIAL_MODEL', 'BUSINESS_PLAN', 'TERM_SHEET', 'CAP_TABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLIC', 'INTERESTED_ONLY');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('ACCEPTED', 'INTRO_CALL', 'MEETING', 'DUE_DILIGENCE', 'TERM_SHEET', 'CLOSED', 'DROPPED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalSeekerProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL DEFAULT 'STARTUP',
    "organisation_name" TEXT,
    "linkedin_url" TEXT,
    "experience_summary" TEXT,
    "city" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalSeekerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "investor_category" "InvestorCategory" NOT NULL DEFAULT 'ANGEL',
    "fund_name" TEXT,
    "aum_range" TEXT,
    "ticket_min" DOUBLE PRECISION,
    "ticket_max" DOUBLE PRECISION,
    "preferred_sectors" TEXT[],
    "preferred_stage" TEXT[],
    "preferred_entity_type" "EntityType" NOT NULL DEFAULT 'BOTH',
    "geography_preference" TEXT,
    "lead_interest" BOOLEAN NOT NULL DEFAULT false,
    "co_invest_interest" BOOLEAN NOT NULL DEFAULT false,
    "board_seat_interest" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "linkedin_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupListing" (
    "id" TEXT NOT NULL,
    "capital_seeker_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL DEFAULT 'STARTUP',
    "location_city" TEXT,
    "location_country" TEXT NOT NULL DEFAULT 'India',
    "funding_ask" DOUBLE PRECISION,
    "valuation_expectation" DOUBLE PRECISION,
    "revenue_last_year" DOUBLE PRECISION,
    "monthly_burn" DOUBLE PRECISION,
    "summary" TEXT NOT NULL,
    "use_of_funds" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "has_purchase_orders" BOOLEAN NOT NULL DEFAULT false,
    "po_value" DOUBLE PRECISION,
    "po_count" INTEGER,
    "has_government_contract" BOOLEAN NOT NULL DEFAULT false,
    "has_ip" BOOLEAN NOT NULL DEFAULT false,
    "ip_description" TEXT,
    "awards_recognition" TEXT,
    "government_contract_proof" TEXT,
    "patent_number" TEXT,
    "accelerator_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "startup_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "document_type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "startup_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "InterestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedStartup" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "startup_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedStartup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupUpdate" (
    "id" TEXT NOT NULL,
    "startup_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StartupUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingScore" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "traction_score" INTEGER NOT NULL DEFAULT 0,
    "financial_score" INTEGER NOT NULL DEFAULT 0,
    "quality" INTEGER NOT NULL DEFAULT 0,
    "hard_score" INTEGER NOT NULL DEFAULT 0,
    "founder_score" INTEGER NOT NULL DEFAULT 0,
    "market_score" INTEGER NOT NULL DEFAULT 0,
    "business_score" INTEGER NOT NULL DEFAULT 0,
    "credibility_score" INTEGER NOT NULL DEFAULT 0,
    "readiness_score" INTEGER NOT NULL DEFAULT 0,
    "narrative_score" INTEGER NOT NULL DEFAULT 0,
    "penalty_points" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'E',
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "confidence_label" TEXT NOT NULL DEFAULT 'Low',
    "momentum_score" INTEGER NOT NULL DEFAULT 0,
    "previous_total" INTEGER NOT NULL DEFAULT 0,
    "previous_traction" INTEGER NOT NULL DEFAULT 0,
    "previous_financial" INTEGER NOT NULL DEFAULT 0,
    "verdict" TEXT NOT NULL DEFAULT '',
    "top_drivers" TEXT[],
    "top_risks" TEXT[],
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "seeker_id" TEXT NOT NULL,
    "interest_id" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "deal_stage" "DealStage" NOT NULL DEFAULT 'ACCEPTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "outcome" TEXT,
    "stage_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage_history" JSONB,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT[],
    "read_by" TEXT[],
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "message_type" TEXT NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "startup_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "type" TEXT NOT NULL,
    "sector" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CapitalSeekerProfile_user_id_key" ON "CapitalSeekerProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_user_id_key" ON "InvestorProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_investor_id_startup_id_key" ON "Interest"("investor_id", "startup_id");

-- CreateIndex
CREATE UNIQUE INDEX "SavedStartup_investor_id_startup_id_key" ON "SavedStartup"("investor_id", "startup_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingScore_listing_id_key" ON "ListingScore"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_interest_id_key" ON "Connection"("interest_id");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_investor_id_listing_id_key" ON "Connection"("investor_id", "listing_id");

-- CreateIndex
CREATE INDEX "Activity_user_id_listing_id_type_idx" ON "Activity"("user_id", "listing_id", "type");

-- CreateIndex
CREATE INDEX "Notification_user_id_read_idx" ON "Notification"("user_id", "read");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalSeekerProfile" ADD CONSTRAINT "CapitalSeekerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupListing" ADD CONSTRAINT "StartupListing_capital_seeker_id_fkey" FOREIGN KEY ("capital_seeker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedStartup" ADD CONSTRAINT "SavedStartup_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedStartup" ADD CONSTRAINT "SavedStartup_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupUpdate" ADD CONSTRAINT "StartupUpdate_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingScore" ADD CONSTRAINT "ListingScore_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
