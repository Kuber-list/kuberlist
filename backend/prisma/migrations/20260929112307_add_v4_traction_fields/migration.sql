-- CreateEnum
CREATE TYPE "TractionUnit" AS ENUM ('PAYING_CUSTOMERS', 'ACTIVE_USERS', 'ACTIVE_BUYERS', 'ACTIVE_SELLERS', 'ACTIVE_CLIENTS', 'ACTIVE_ACCOUNTS', 'TRANSACTIONS', 'ORDERS', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialEvidenceType" AS ENUM ('PURCHASE_ORDER', 'SIGNED_CONTRACT', 'PAID_PILOT', 'LOI', 'OTHER');

-- AlterTable
ALTER TABLE "StartupListing" ADD COLUMN     "customers_current" INTEGER,
ADD COLUMN     "customers_previous" INTEGER,
ADD COLUMN     "recurring_revenue_percent" DOUBLE PRECISION,
ADD COLUMN     "repeat_customers" INTEGER,
ADD COLUMN     "repeat_orders" INTEGER,
ADD COLUMN     "revenue_previous_year" DOUBLE PRECISION,
ADD COLUMN     "traction_unit" "TractionUnit" NOT NULL DEFAULT 'PAYING_CUSTOMERS';

-- CreateTable
CREATE TABLE "CommercialEvidence" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "evidence_type" "CommercialEvidenceType" NOT NULL,
    "count" INTEGER,
    "total_value" DOUBLE PRECISION,
    "realized_value" DOUBLE PRECISION,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommercialEvidence_listing_id_idx" ON "CommercialEvidence"("listing_id");

-- CreateIndex
CREATE INDEX "CommercialEvidence_evidence_type_idx" ON "CommercialEvidence"("evidence_type");

-- AddForeignKey
ALTER TABLE "CommercialEvidence" ADD CONSTRAINT "CommercialEvidence_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "StartupListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
