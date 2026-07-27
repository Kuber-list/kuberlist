import { createConnectionFromInterest } from './connection.js';
import { notifyInterestReceived } from '../services/notification.service.js';
import { trackActivity } from '../middleware/activity.js';
import prisma from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';

export const sendInterest = async (req, res, next) => {
  try {
    const { startup_id, message } = req.body;
    if (!startup_id) throw createError(400, 'startup_id required');

    const listing = await prisma.startupListing.findFirst({ where: { id: startup_id, status: 'ACTIVE', is_active: true } });
    if (!listing) throw createError(404, 'Listing not found or not active');

    const existing = await prisma.interest.findUnique({ where: { investor_id_startup_id: { investor_id: req.user.id, startup_id } } });
    if (existing) throw createError(409, 'Interest already expressed');

    const interest = await prisma.interest.create({
      data: { investor_id: req.user.id, startup_id, message: message || null },
      include: { investor: { select: { id: true, name: true, email: true } }, startup: { select: { id: true, name: true } } },
    });
    // Notify capital seeker of new interest
    notifyInterestReceived(listing.capital_seeker_id, req.user.name, listing.name, startup_id).catch(() => {});
    // Track activity
    trackActivity(req.user.id, startup_id, 'INTEREST', listing.sector).catch(() => {});
    res.status(201).json({ success: true, data: interest });
  } catch (err) { next(err); }
};

export const getInterestsForStartup = async (req, res, next) => {
  try {
    const listing = await prisma.startupListing.findFirst({ where: { id: req.params.startupId, capital_seeker_id: req.user.id } });
    if (!listing) throw createError(404, 'Listing not found');

    const interests = await prisma.interest.findMany({
      where:   { startup_id: req.params.startupId },
      include: { investor: { select: { id: true, name: true, email: true, investorProfile: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: interests });
  } catch (err) { next(err); }
};

export const updateInterestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status)) throw createError(400, 'Status must be ACCEPTED or REJECTED');

    const interest = await prisma.interest.findUnique({
      where:   { id: req.params.id },
      include: { startup: true },
    });
    if (!interest) throw createError(404, 'Interest not found');
    if (interest.startup.capital_seeker_id !== req.user.id) throw createError(403, 'Not your listing');

    const updated = await prisma.interest.update({
      where: { id: req.params.id }, data: { status },
      include: { investor: { select: { id: true, name: true, email: true } } },
    });

    // Notify investor that their interest status changed
    // (no dedicated notification for now — handled in sidebar badge)

    // Auto-create connection when interest is accepted
    if (status === 'ACCEPTED') {
      createConnectionFromInterest(updated).catch(err =>
        console.error('[Connection] Failed to auto-create connection:', err.message)
      );
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const getMyInterests = async (req, res, next) => {
  try {
    const interests = await prisma.interest.findMany({
      where:   { investor_id: req.user.id },
      include: { startup: { include: { capital_seeker: { select: { id: true, name: true } }, _count: { select: { interests: true } } } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: interests });
  } catch (err) { next(err); }
};
