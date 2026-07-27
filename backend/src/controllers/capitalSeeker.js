import prisma from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await prisma.capitalSeekerProfile.findUnique({ where: { user_id: req.user.id } });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const upsertProfile = async (req, res, next) => {
  try {
    const { entity_type, organisation_name, linkedin_url, experience_summary, city, country } = req.body;
    const profile = await prisma.capitalSeekerProfile.upsert({
      where:  { user_id: req.user.id },
      update: { entity_type, organisation_name, linkedin_url, experience_summary, city, country },
      create: { user_id: req.user.id, entity_type, organisation_name, linkedin_url, experience_summary, city, country },
    });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const getDashboard = async (req, res, next) => {
  try {
    const listings = await prisma.startupListing.findMany({
      where:   { capital_seeker_id: req.user.id },
      include: { _count: { select: { interests: true } }, interests: { orderBy: { created_at: 'desc' }, take: 5, include: { investor: { select: { id: true, name: true, email: true, investorProfile: true } } } } },
      orderBy: { created_at: 'desc' },
    });

    const totalListings   = listings.length;
    const totalInterests  = listings.reduce((a, l) => a + l._count.interests, 0);
    const pendingInterests = listings.reduce((a, l) => a + l.interests.filter(i => i.status === 'PENDING').length, 0);
    const recentInterests = listings.flatMap(l => l.interests).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    res.json({ success: true, data: { totalListings, totalInterests, pendingInterests, listings, recentInterests } });
  } catch (err) { next(err); }
};

export const getPendingInterestCount = async (req, res, next) => {
  try {
    // Count pending interests across all seeker's listings
    const listings = await prisma.startupListing.findMany({
      where: { capital_seeker_id: req.user.id },
      select: { id: true },
    });
    const listingIds = listings.map(l => l.id);
    const count = await prisma.interest.count({
      where: { startup_id: { in: listingIds }, status: 'PENDING' },
    });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};
