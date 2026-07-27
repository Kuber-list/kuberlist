/**
 * Activity Tracking Middleware
 * Tracks user actions with deduplication (1 VIEW per listing per user per hour)
 */

import prisma from '../utils/prisma.js';

const ONE_HOUR = 60 * 60 * 1000;

export async function trackActivity(userId, listingId, type, sector = null) {
  try {
    // Deduplication for VIEW events — max 1 per hour per listing per user
    if (type === 'VIEW' && listingId) {
      const recent = await prisma.activity.findFirst({
        where: {
          user_id:    userId,
          listing_id: listingId,
          type:       'VIEW',
          created_at: { gte: new Date(Date.now() - ONE_HOUR) },
        },
      });
      if (recent) return; // already tracked this hour
    }

    await prisma.activity.create({
      data: { user_id: userId, listing_id: listingId, type, sector },
    });
  } catch (err) {
    // Silent fail — activity tracking must never break core functionality
    console.error('[Activity] Failed:', err.message);
  }
}

// Express middleware for auto-tracking listing views
export const trackListingView = (getSector = null) => async (req, res, next) => {
  if (req.user) {
    const listingId = req.params.id || req.params.startupId;
    // Fire and forget — don't await
    trackActivity(req.user.id, listingId, 'VIEW', getSector).catch(() => {});
  }
  next();
};
