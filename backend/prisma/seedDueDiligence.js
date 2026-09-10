import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templateName = "Startup Due Diligence";

const items = [
  // CORPORATE
  {
    category: "CORPORATE",
    title: "Certificate of Incorporation / Registration",
    classification: "CORE",
    weight: 5,
    sort_order: 1,
  },
  {
    category: "CORPORATE",
    title: "Memorandum & Articles / Constitutional Documents",
    classification: "CORE",
    weight: 4,
    sort_order: 2,
  },
  {
    category: "CORPORATE",
    title: "Current Company / Registered Entity Details",
    classification: "CORE",
    weight: 3,
    sort_order: 3,
  },
  {
    category: "CORPORATE",
    title: "Directors / Key Authorised Persons",
    classification: "CORE",
    weight: 4,
    sort_order: 4,
  },
  {
    category: "CORPORATE",
    title: "Statutory Registrations & Licences",
    classification: "IF_APPLICABLE",
    weight: 3,
    sort_order: 5,
  },
  {
    category: "CORPORATE",
    title: "Registered Office / Principal Place of Business",
    classification: "CORE",
    weight: 2,
    sort_order: 6,
  },

  // OWNERSHIP
  {
    category: "OWNERSHIP",
    title: "Current Cap Table",
    classification: "CORE",
    weight: 8,
    sort_order: 1,
  },
  {
    category: "OWNERSHIP",
    title: "Founder / Promoter Ownership",
    classification: "CORE",
    weight: 5,
    sort_order: 2,
  },
  {
    category: "OWNERSHIP",
    title: "Share Issuance / Allotment Records",
    classification: "CORE",
    weight: 5,
    sort_order: 3,
  },
  {
    category: "OWNERSHIP",
    title: "Existing Investor Holdings",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 4,
  },
  {
    category: "OWNERSHIP",
    title: "ESOP / Employee Option Pool Documentation",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 5,
  },
  {
    category: "OWNERSHIP",
    title: "Convertible Instruments / Outstanding Rights",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 6,
  },
  {
    category: "OWNERSHIP",
    title: "Shareholder / Investment Agreements",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 7,
  },

  // FINANCIAL
  {
    category: "FINANCIAL",
    title: "Latest Financial Statements",
    classification: "CORE",
    weight: 8,
    sort_order: 1,
  },
  {
    category: "FINANCIAL",
    title: "Latest Management Accounts / Current Financials",
    classification: "CORE",
    weight: 6,
    sort_order: 2,
  },
  {
    category: "FINANCIAL",
    title: "Bank Statements / Banking Evidence",
    classification: "CORE",
    weight: 5,
    sort_order: 3,
  },
  {
    category: "FINANCIAL",
    title: "Revenue & Income Evidence",
    classification: "CORE",
    weight: 6,
    sort_order: 4,
  },
  {
    category: "FINANCIAL",
    title: "Cash Position & Cash Runway",
    classification: "CORE",
    weight: 5,
    sort_order: 5,
  },
  {
    category: "FINANCIAL",
    title: "Financial Projections",
    classification: "CORE",
    weight: 6,
    sort_order: 6,
  },
  {
    category: "FINANCIAL",
    title: "Existing Debt / Borrowings",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 7,
  },
  {
    category: "FINANCIAL",
    title: "Outstanding Financial Liabilities",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 8,
  },
  {
    category: "FINANCIAL",
    title: "Related-Party Financial Transactions",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 9,
  },

  // TAX
  {
    category: "TAX",
    title: "Income Tax Returns / Filings",
    classification: "CORE",
    weight: 6,
    sort_order: 1,
  },
  {
    category: "TAX",
    title: "GST Registration & Applicable GST Records",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 2,
  },
  {
    category: "TAX",
    title: "GST Returns / Filing Compliance",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 3,
  },
  {
    category: "TAX",
    title: "Tax Liabilities / Outstanding Tax Demands",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 4,
  },
  {
    category: "TAX",
    title: "Other Applicable Tax Registrations / Filings",
    classification: "IF_APPLICABLE",
    weight: 3,
    sort_order: 5,
  },

  // LEGAL
  {
    category: "LEGAL",
    title: "Material Customer Contracts",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 1,
  },
  {
    category: "LEGAL",
    title: "Material Supplier / Vendor Contracts",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 2,
  },
  {
    category: "LEGAL",
    title: "Material Litigation / Dispute Disclosure",
    classification: "IF_APPLICABLE",
    weight: 6,
    sort_order: 3,
  },
  {
    category: "LEGAL",
    title: "Intellectual Property Ownership",
    classification: "IF_APPLICABLE",
    weight: 6,
    sort_order: 4,
  },
  {
    category: "LEGAL",
    title: "IP Licences / Third-Party IP Rights",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 5,
  },
  {
    category: "LEGAL",
    title: "Material Regulatory / Business Licences",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 6,
  },
  {
    category: "LEGAL",
    title: "Material Employment / Key Management Obligations",
    classification: "IF_APPLICABLE",
    weight: 3,
    sort_order: 7,
  },
  {
    category: "LEGAL",
    title: "Material Related-Party Agreements",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 8,
  },

  // COMMERCIAL
  {
    category: "COMMERCIAL",
    title: "Revenue / Sales Evidence",
    classification: "IF_APPLICABLE",
    weight: 6,
    sort_order: 1,
  },
  {
    category: "COMMERCIAL",
    title: "Key Customer / Client Base",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 2,
  },
  {
    category: "COMMERCIAL",
    title: "Customer Concentration",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 3,
  },
  {
    category: "COMMERCIAL",
    title: "Material Customer Commitments / Contracted Revenue",
    classification: "IF_APPLICABLE",
    weight: 5,
    sort_order: 4,
  },
  {
    category: "COMMERCIAL",
    title: "Sales Pipeline / Order Book",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 5,
  },
  {
    category: "COMMERCIAL",
    title: "Key Commercial Partnerships",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 6,
  },
  {
    category: "COMMERCIAL",
    title: "Pricing / Revenue Model Evidence",
    classification: "CORE",
    weight: 4,
    sort_order: 7,
  },

  // BUSINESS
  {
    category: "BUSINESS",
    title: "Business Model & Revenue Mechanism",
    classification: "CORE",
    weight: 6,
    sort_order: 1,
  },
  {
    category: "BUSINESS",
    title: "Product / Service Description",
    classification: "CORE",
    weight: 5,
    sort_order: 2,
  },
  {
    category: "BUSINESS",
    title: "Market & Target Customer Segment",
    classification: "CORE",
    weight: 5,
    sort_order: 3,
  },
  {
    category: "BUSINESS",
    title: "Business Plan / Strategic Plan",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 4,
  },
  {
    category: "BUSINESS",
    title: "Key Business Dependencies",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 5,
  },
  {
    category: "BUSINESS",
    title: "Material Operational Risks",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 6,
  },
  {
    category: "BUSINESS",
    title: "Key Management / Founder Information",
    classification: "CORE",
    weight: 5,
    sort_order: 7,
  },
  {
    category: "BUSINESS",
    title: "Material Business Assets / Infrastructure",
    classification: "IF_APPLICABLE",
    weight: 3,
    sort_order: 8,
  },

  // OTHER
  {
    category: "OTHER",
    title: "Material Insurance Coverage",
    classification: "IF_APPLICABLE",
    weight: 3,
    sort_order: 1,
  },
  {
    category: "OTHER",
    title: "Material Other Obligations / Commitments",
    classification: "IF_APPLICABLE",
    weight: 4,
    sort_order: 2,
  },
  {
    category: "OTHER",
    title: "Other Material Information Relevant to Investment",
    classification: "IF_APPLICABLE",
    weight: 3,
    sort_order: 3,
  },
];

async function main() {
  console.log("🔐 Seeding Startup DD configuration...");
  console.log("⚠️  This seed does NOT delete any existing data.");

  const template = await prisma.dDChecklistTemplate.upsert({
    where: {
      id: "startup-dd-template-v1",
    },
    update: {
      name: templateName,
      description: "Standard KuberList due diligence checklist for startups.",
      entity_type: "STARTUP",
      is_active: true,
    },
    create: {
      id: "startup-dd-template-v1",
      name: templateName,
      description: "Standard KuberList due diligence checklist for startups.",
      entity_type: "STARTUP",
      is_active: true,
    },
  });

  for (const item of items) {
    await prisma.dDChecklistItem.upsert({
      where: {
        id: `startup-dd-${item.category.toLowerCase()}-${item.sort_order}`,
      },
      update: {
        category: item.category,
        title: item.title,
        required: item.classification === "CORE",
        applicability: item.classification,
        weight: item.weight,
        sort_order: item.sort_order,
      },
      create: {
        id: `startup-dd-${item.category.toLowerCase()}-${item.sort_order}`,
        template_id: template.id,
        category: item.category,
        title: item.title,
        required: item.classification === "CORE",
        applicability: item.classification,
        weight: item.weight,
        sort_order: item.sort_order,
      },
    });
  }

  console.log("✅ Startup DD template created/updated.");
  console.log(`✅ ${items.length} checklist items created/updated.`);

  const counts = await prisma.dDChecklistItem.groupBy({
    by: ["category"],
    where: {
      template_id: template.id,
    },
    _count: {
      id: true,
    },
  });

  console.table(
    counts.map((row) => ({
      category: row.category,
      items: row._count.id,
    })),
  );
}

main()
  .catch((error) => {
    console.error("❌ DD seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
