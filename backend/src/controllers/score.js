import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import { generateReport } from "../services/scoring.js";
import { getDecision } from "../services/decision.service.js";
import { getImprovements } from "../services/improvement.service.js";
import { notifyScoreImproved } from "../services/notification.service.js";
import {
  fetchListingData,
  persistScore,
  refreshListingScore,
} from "../services/score.service.js";

// ── Capital Seeker: compute & get score ──────────────────────────
export const getScore = async (req, res, next) => {
  try {
    const listing = await fetchListingData(req.params.id, req.user.id);
    if (!listing) throw createError(404, "Listing not found");

    // Get previous score for momentum & notification
    const prevScore = await prisma.listingScore.findUnique({
      where: { listing_id: listing.id },
    });

    const profile = listing.capital_seeker?.capitalSeekerProfile;
    const docTypes = listing.documents.map((d) => d.document_type);
    const updateCount = listing._count.updates;

    const scores = await refreshListingScore(listing.id);
    const decision = getDecision(scores);

    const improvements = getImprovements(listing, profile, docTypes, scores);
    // Notify if grade improved
    if (prevScore && prevScore.grade !== scores.grade) {
      notifyScoreImproved(
        req.user.id,
        listing.name,
        listing.id,
        prevScore.grade,
        scores.grade,
      ).catch(() => {});
    }

    res.json({
      success: true,
      data: { ...scores, decision, improvements, listing_id: listing.id },
    });
  } catch (err) {
    next(err);
  }
};

// ── Capital Seeker: generate full report ─────────────────────────
export const getReport = async (req, res, next) => {
  try {
    let listing;

    if (req.user.role === "CAPITAL_SEEKER") {
      listing = await fetchListingData(req.params.id, req.user.id);
    } else {
      listing = await fetchListingData(req.params.id);
    }

    if (!listing) throw createError(404, "Listing not found");

    const profile = listing.capital_seeker?.capitalSeekerProfile;
    const docTypes = listing.documents.map((d) => d.document_type);
    const docCount = listing._count.documents;
    const interestCount = listing._count.interests;
    const updateCount = listing._count.updates;

    const scores = await refreshListingScore(listing.id);
    const report = generateReport(
      listing,
      profile,
      docCount,
      interestCount,
      updateCount,
      scores,
      docTypes,
    );
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// ── Public/Investor: get stored score ────────────────────────────
export const getPublicScore = async (req, res, next) => {
  try {
    const score = await prisma.listingScore.findUnique({
      where: { listing_id: req.params.id },
    });
    if (!score) return res.json({ success: true, data: null });
    const decision = getDecision(score);
    res.json({ success: true, data: { ...score, decision } });
  } catch (err) {
    next(err);
  }
};
