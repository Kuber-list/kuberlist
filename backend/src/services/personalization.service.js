/**
 * Personalization Engine
 * Builds a behavioral sector profile from activity
 * Blends with declared preferences for cold-start handling
 *
 * Activity weights:
 *   DISCUSSION = 6
 *   INTEREST   = 5
 *   SAVE       = 3
 *   VIEW       = 1
 */

import prisma from '../utils/prisma.js';

const WEIGHTS = { DISCUSSION: 6, INTEREST: 5, SAVE: 3, VIEW: 1 };

export async function buildUserProfile(userId) {
  const activities = await prisma.activity.findMany({
    where: { user_id: userId, sector: { not: null } },
    orderBy: { created_at: 'desc' },
    take: 200, // last 200 activities
  });

  const profile = {};
  for (const act of activities) {
    const weight = WEIGHTS[act.type] || 1;
    // Decay: recent activity worth more (linear decay over 90 days)
    const daysSince = Math.floor((Date.now() - new Date(act.created_at)) / 86400000);
    const decay = Math.max(0.1, 1 - daysSince / 90);
    const score = weight * decay;
    profile[act.sector] = (profile[act.sector] || 0) + score;
  }

  return profile; // { FinTech: 12.4, SaaS: 8.2, ... }
}

export function getActivityMatchScore(activityProfile, listingSector) {
  if (!activityProfile || Object.keys(activityProfile).length === 0) return 0;
  const raw = activityProfile[listingSector] || 0;
  // Normalise to 0-100
  const maxVal = Math.max(...Object.values(activityProfile), 1);
  return Math.round((raw / maxVal) * 100);
}

export function getPreferenceMatchScore(investorProfile, listing) {
  if (!investorProfile) return 0;
  let pts = 0;

  // Sector
  const prefSectors = investorProfile.preferred_sectors || [];
  if (prefSectors.includes(listing.sector)) pts += 40;

  // Stage
  const prefStages = investorProfile.preferred_stage || [];
  if (prefStages.includes(listing.stage)) pts += 25;

  // Ticket range
  const ask = listing.funding_ask || 0;
  const min = investorProfile.ticket_min || 0;
  const max = investorProfile.ticket_max || Infinity;
  if (ask >= min && ask <= max) pts += 25;
  else if (ask >= min * 0.7 && ask <= max * 1.3) pts += 12;

  // Entity type
  const prefEntity = investorProfile.preferred_entity_type;
  if (prefEntity === 'BOTH' || prefEntity === listing.entity_type) pts += 10;

  return Math.min(pts, 100);
}

export function blendMatchScore(activityProfile, investorProfile, listing) {
  const activityScore   = getActivityMatchScore(activityProfile, listing.sector);
  const preferenceScore = getPreferenceMatchScore(investorProfile, listing);
  const hasActivity     = Object.keys(activityProfile || {}).length > 0;

  // Cold start: use preference only; blend as activity accumulates
  if (!hasActivity) return preferenceScore;
  return Math.round(0.7 * activityScore + 0.3 * preferenceScore);
}

export function calculateRankScore(matchScore, totalScore, momentumScore) {
  const base = (0.5 * matchScore) + (0.3 * totalScore) + (0.2 * momentumScore * 10);
  return Math.round(Math.min(base, 100));
}
