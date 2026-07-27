import prisma from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { user_id: req.user.id } });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const upsertProfile = async (req, res, next) => {
  try {
    const { investor_category, fund_name, aum_range, ticket_min, ticket_max,
            preferred_sectors, preferred_stage, preferred_entity_type,
            geography_preference, lead_interest, co_invest_interest,
            board_seat_interest, bio, linkedin_url } = req.body;

    const profile = await prisma.investorProfile.upsert({
      where:  { user_id: req.user.id },
      update: { investor_category, fund_name, aum_range,
        ticket_min:   ticket_min  ? parseFloat(ticket_min)  : null,
        ticket_max:   ticket_max  ? parseFloat(ticket_max)  : null,
        preferred_sectors:     preferred_sectors     || [],
        preferred_stage:       preferred_stage       || [],
        preferred_entity_type: preferred_entity_type || 'BOTH',
        geography_preference, lead_interest: !!lead_interest,
        co_invest_interest: !!co_invest_interest, board_seat_interest: !!board_seat_interest,
        bio, linkedin_url },
      create: { user_id: req.user.id, investor_category: investor_category || 'ANGEL',
        fund_name, aum_range,
        ticket_min: ticket_min ? parseFloat(ticket_min) : null,
        ticket_max: ticket_max ? parseFloat(ticket_max) : null,
        preferred_sectors: preferred_sectors || [], preferred_stage: preferred_stage || [],
        preferred_entity_type: preferred_entity_type || 'BOTH',
        geography_preference, lead_interest: !!lead_interest,
        co_invest_interest: !!co_invest_interest, board_seat_interest: !!board_seat_interest,
        bio, linkedin_url },
    });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const getDashboard = async (req, res, next) => {
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { user_id: req.user.id } });

    const [interests, savedStartups] = await Promise.all([
      prisma.interest.findMany({
        where:   { investor_id: req.user.id },
        include: { startup: { include: {
          capital_seeker: { select: { id: true, name: true } },
          score: true,
          _count: { select: { interests: true } },
        }}},
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      prisma.savedStartup.findMany({
        where:   { investor_id: req.user.id },
        include: { startup: { include: {
          capital_seeker: { select: { id: true, name: true } },
          _count: { select: { interests: true } },
        }}},
        orderBy: { created_at: 'desc' },
        take: 6,
      }),
    ]);

    // ── Preference-based recommendations (exclude already interested) ──
    const interestedIds = interests.map(i => i.startup_id);
    let recommended = [];
    if (profile) {
      const where = {
        status: 'ACTIVE', is_active: true,
        id: { notIn: interestedIds }, // don't recommend listings already interacted with
        ...(profile.preferred_sectors?.length && { sector: { in: profile.preferred_sectors } }),
        ...(profile.preferred_stage?.length   && { stage:  { in: profile.preferred_stage } }),
        ...(profile.preferred_entity_type !== 'BOTH' && { entity_type: profile.preferred_entity_type }),
        ...(profile.ticket_min && { funding_ask: { gte: profile.ticket_min } }),
        ...(profile.ticket_max && { funding_ask: { lte: profile.ticket_max } }),
      };
      recommended = await prisma.startupListing.findMany({
        where,
        include: { capital_seeker: { select: { id: true, name: true } }, score: true, _count: { select: { interests: true } } },
        orderBy: { created_at: 'desc' },
        take: 6,
      });
    }

    // ── Interest-based contextual messages ──
    // Group interests by status so frontend can show relevant messages
    const acceptedInterests  = interests.filter(i => i.status === 'ACCEPTED');
    const pendingInterests   = interests.filter(i => i.status === 'PENDING');
    const rejectedInterests  = interests.filter(i => i.status === 'REJECTED');

    // Similar listings to accepted/pending interests (same sector)
    let similarListings = [];
    if (interests.length > 0) {
      const myInterestSectors = [...new Set(interests.map(i => i.startup?.sector).filter(Boolean))];
      similarListings = await prisma.startupListing.findMany({
        where: {
          status: 'ACTIVE', is_active: true,
          id: { notIn: interestedIds },
          sector: { in: myInterestSectors },
        },
        include: { capital_seeker: { select: { id: true, name: true } }, score: true, _count: { select: { interests: true } } },
        orderBy: { created_at: 'desc' },
        take: 4,
      });
    }

    res.json({
      success: true,
      data: {
        interests,
        savedStartups,
        recommended,
        similarListings,
        interestStats: {
          total:    interests.length,
          accepted: acceptedInterests.length,
          pending:  pendingInterests.length,
          rejected: rejectedInterests.length,
        },
        totalInterests: interests.length,
        totalSaved:     savedStartups.length,
      },
    });
  } catch (err) { next(err); }
};

export const saveStartup = async (req, res, next) => {
  try {
    const { startup_id } = req.body;
    const listing = await prisma.startupListing.findFirst({ where: { id: startup_id, status: 'ACTIVE' } });
    if (!listing) throw createError(404, 'Listing not found');

    const existing = await prisma.savedStartup.findUnique({ where: { investor_id_startup_id: { investor_id: req.user.id, startup_id } } });
    if (existing) {
      await prisma.savedStartup.delete({ where: { id: existing.id } });
      return res.json({ success: true, saved: false, message: 'Removed from saved' });
    }
    await prisma.savedStartup.create({ data: { investor_id: req.user.id, startup_id } });
    res.json({ success: true, saved: true, message: 'Saved' });
  } catch (err) { next(err); }
};

export const getSaved = async (req, res, next) => {
  try {
    const saved = await prisma.savedStartup.findMany({
      where:   { investor_id: req.user.id },
      include: { startup: { include: { capital_seeker: { select: { id: true, name: true } }, _count: { select: { interests: true } } } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: saved });
  } catch (err) { next(err); }
};
