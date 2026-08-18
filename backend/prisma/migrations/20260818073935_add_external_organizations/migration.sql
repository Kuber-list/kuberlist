-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "external_organization_id" TEXT,
ALTER COLUMN "listing_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ExternalOrganization" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "sector" TEXT,
    "country" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalOrganization_investor_id_idx" ON "ExternalOrganization"("investor_id");

-- CreateIndex
CREATE INDEX "Investment_external_organization_id_idx" ON "Investment"("external_organization_id");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_external_organization_id_fkey" FOREIGN KEY ("external_organization_id") REFERENCES "ExternalOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalOrganization" ADD CONSTRAINT "ExternalOrganization_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
