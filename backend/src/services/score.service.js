export const fetchListingData = async (listingId, seekerId = null) => {
  const where = seekerId
    ? { id: listingId, capital_seeker_id: seekerId }
    : { id: listingId };
  return prisma.startupListing.findFirst({
    where,
    include: {
      capital_seeker: { include: { capitalSeekerProfile: true } },
      documents: { select: { document_type: true } },
      _count: { select: { interests: true, updates: true, documents: true } },
    },
  });
};

export const persistScore = async (listingId, scores) => {
  const {
    // Non-DB fields to exclude
    category,
    category_color,
    category_description,
    // Fields to keep
    quality,
    traction_score,
    financial_score,
    hard_score,
    narrative_score,
    total_score,
    grade,
    confidence_score,
    confidence_label,
    momentum_score,
    previous_total,
    previous_traction,
    previous_financial,
    verdict,
    top_drivers,
    top_risks,
    risk_score,
  } = scores;

  const data = {
    quality: quality || 0,
    traction_score,
    financial_score,
    hard_score,
    narrative_score,
    penalty_points: risk_score || 0,
    total_score,
    grade,
    confidence_score,
    confidence_label,
    momentum_score,
    previous_total: previous_total || 0,
    previous_traction: previous_traction || 0,
    previous_financial: previous_financial || 0,
    verdict: verdict || "",
    top_drivers: top_drivers || [],
    top_risks: top_risks || [],
    // // risk_score is calculated at runtime and is not currently persisted
  };

  return prisma.listingScore.upsert({
    where: { listing_id: listingId },
    update: { ...data, last_updated: new Date() },
    create: { listing_id: listingId, ...data },
  });
};
import { scoreListing } from "./scoring.js";
import prisma from "../utils/prisma.js";

export const refreshListingScore = async (listingId) => {
  const listing = await fetchListingData(listingId);

  if (!listing) return null;

  const profile = listing.capital_seeker?.capitalSeekerProfile;
  const docTypes = listing.documents.map((d) => d.document_type);

  const prevScore = await prisma.listingScore.findUnique({
    where: { listing_id: listingId },
  });

  const scores = scoreListing(
    listing,
    profile,
    docTypes,
    listing._count.updates,
    prevScore,
  );

  await persistScore(listingId, scores);

  return scores;
};
