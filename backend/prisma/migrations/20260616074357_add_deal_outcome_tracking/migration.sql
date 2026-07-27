-- AlterTable
ALTER TABLE "Connection" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "deal_amount" DOUBLE PRECISION,
ADD COLUMN     "lead_investor_name" TEXT,
ADD COLUMN     "outcome_notes" TEXT,
ADD COLUMN     "round_type" TEXT;
