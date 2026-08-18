-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'EXITED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "InvestmentInstrument" AS ENUM ('EQUITY', 'SAFE', 'CONVERTIBLE_NOTE', 'DEBT', 'REVENUE_BASED_FINANCING', 'OTHER');

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "connection_id" TEXT,
    "invested_amount" DOUBLE PRECISION NOT NULL,
    "invested_at" TIMESTAMP(3) NOT NULL,
    "instrument" "InvestmentInstrument" NOT NULL DEFAULT 'EQUITY',
    "entry_valuation" DOUBLE PRECISION,
    "ownership_percentage" DOUBLE PRECISION,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_value_override" DOUBLE PRECISION,
    "exit_value" DOUBLE PRECISION,
    "exited_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyValuation" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "valuation" DOUBLE PRECISION NOT NULL,
    "valuation_date" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyValuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investment_connection_id_key" ON "Investment"("connection_id");

-- CreateIndex
CREATE INDEX "Investment_investor_id_idx" ON "Investment"("investor_id");

-- CreateIndex
CREATE INDEX "Investment_listing_id_idx" ON "Investment"("listing_id");

-- CreateIndex
CREATE INDEX "Investment_status_idx" ON "Investment"("status");

-- CreateIndex
CREATE INDEX "CompanyValuation_listing_id_idx" ON "CompanyValuation"("listing_id");

-- CreateIndex
CREATE INDEX "CompanyValuation_valuation_date_idx" ON "CompanyValuation"("valuation_date");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyValuation_listing_id_valuation_date_key" ON "CompanyValuation"("listing_id", "valuation_date");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "Connection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyValuation" ADD CONSTRAINT "CompanyValuation_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
