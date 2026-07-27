import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding KuberList...");

  // Clear existing
  // New tables first
  await prisma.sharedDocument.deleteMany();
  await prisma.diligenceRequest.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.documentAccessLog.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.activity.deleteMany();

  // Existing tables
  await prisma.interest.deleteMany();
  await prisma.savedStartup.deleteMany();
  await prisma.document.deleteMany();
  await prisma.startupUpdate.deleteMany();
  await prisma.startupListing.deleteMany();
  await prisma.capitalSeekerProfile.deleteMany();
  await prisma.investorProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw) => bcrypt.hashSync(pw, 12);
  await prisma.user.upsert({
    where: {
      id: "system-user",
    },
    update: {},
    create: {
      id: "system-user",
      name: "KuberList System",
      email: "system@kuberlist.local",
      password_hash: hash("DO_NOT_USE"),
      role: "ADMIN",
      is_system: true,
    },
  });
  // Admin
  await prisma.user.create({
    data: {
      name: "KuberList Admin",
      email: "admin@kuberlist.com",
      password_hash: hash("admin123"),
      role: "ADMIN",
    },
  });

  // Capital Seekers
  const seeker1 = await prisma.user.create({
    data: {
      name: "Arjun Sharma",
      email: "arjun@nexapay.io",
      password_hash: hash("seeker123"),
      role: "CAPITAL_SEEKER",
      capitalSeekerProfile: {
        create: {
          entity_type: "STARTUP",
          organisation_name: "NexaPay",
          linkedin_url: "https://linkedin.com/in/arjunsharma",
          experience_summary:
            "8 years in FinTech. Ex-Razorpay, IIT Bombay alumni.",
          city: "Mumbai",
          country: "India",
        },
      },
    },
  });

  const seeker2 = await prisma.user.create({
    data: {
      name: "Priya Menon",
      email: "priya@agrisense.in",
      password_hash: hash("seeker123"),
      role: "CAPITAL_SEEKER",
      capitalSeekerProfile: {
        create: {
          entity_type: "SME",
          organisation_name: "AgriSense",
          experience_summary: "12 years in AgriTech. Serving 3,000+ farmers.",
          city: "Pune",
          country: "India",
        },
      },
    },
  });

  // Investor
  const investor1 = await prisma.user.create({
    data: {
      name: "Rahul Kapoor",
      email: "rahul@vcfund.com",
      password_hash: hash("investor123"),
      role: "INVESTOR",
      investorProfile: {
        create: {
          investor_category: "ANGEL",
          fund_name: "Kapoor Angels",
          aum_range: "₹10Cr - ₹50Cr",
          ticket_min: 1000000,
          ticket_max: 20000000,
          preferred_sectors: ["FinTech", "AgriTech", "SaaS"],
          preferred_stage: ["pre_seed", "seed"],
          preferred_entity_type: "BOTH",
          geography_preference: "India",
          lead_interest: true,
          co_invest_interest: true,
          bio: "Angel investor with 15+ investments across India.",
          linkedin_url: "https://linkedin.com/in/rahulkapoor",
        },
      },
    },
  });

  // Listings (DRAFT — must go through review)
  await prisma.startupListing.create({
    data: {
      capital_seeker_id: seeker1.id,
      name: "NexaPay",
      sector: "FinTech",
      stage: "seed",
      entity_type: "STARTUP",
      location_city: "Mumbai",
      funding_ask: 20000000,
      valuation_expectation: 100000000,
      revenue_last_year: 5000000,
      monthly_burn: 800000,
      summary:
        "UPI-first payment infrastructure for Tier 2 and Tier 3 cities with vernacular language support.",
      use_of_funds:
        "Product expansion, team hiring, and market penetration in 5 new states.",
      status: "DRAFT",
    },
  });

  await prisma.startupListing.create({
    data: {
      capital_seeker_id: seeker2.id,
      name: "AgriSense",
      sector: "AgriTech",
      stage: "pre_seed",
      entity_type: "SME",
      location_city: "Pune",
      funding_ask: 8000000,
      revenue_last_year: 2000000,
      monthly_burn: 300000,
      summary:
        "IoT-based soil health monitoring platform serving 3,000+ farmers across Maharashtra.",
      use_of_funds:
        "Hardware production, distribution network, and R&D for new sensors.",
      status: "DRAFT",
    },
  });

  console.log("✅ Seed complete!");
  console.log("");
  console.log("Demo Accounts:");
  console.log("  Admin:          admin@kuberlist.com   / admin123");
  console.log("  Capital Seeker: arjun@nexapay.io      / seeker123");
  console.log("  Capital Seeker: priya@agrisense.in    / seeker123");
  console.log("  Investor:       rahul@vcfund.com      / investor123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
