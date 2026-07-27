import prisma from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';

export const postUpdate = async (req, res, next) => {
  try {
    const { startup_id, title, content } = req.body;
    if (!startup_id || !title || !content) throw createError(400, 'startup_id, title and content required');

    const listing = await prisma.startupListing.findFirst({ where: { id: startup_id, capital_seeker_id: req.user.id } });
    if (!listing) throw createError(404, 'Listing not found');

    const update = await prisma.startupUpdate.create({ data: { startup_id, title, content } });
    res.status(201).json({ success: true, data: update });
  } catch (err) { next(err); }
};

export const getUpdates = async (req, res, next) => {
  try {
    const updates = await prisma.startupUpdate.findMany({
      where:   { startup_id: req.params.startupId },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: updates });
  } catch (err) { next(err); }
};
