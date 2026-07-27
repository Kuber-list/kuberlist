import prisma from '../utils/prisma.js';
import { trackActivity } from '../middleware/activity.js';

export const logActivity = async (req, res, next) => {
  try {
    const { listing_id, type, sector } = req.body;
    if (!type) return res.json({ success: true }); // silent ignore
    await trackActivity(req.user.id, listing_id, type, sector);
    res.json({ success: true });
  } catch (err) { next(err); }
};
