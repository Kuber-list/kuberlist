import prisma from '../utils/prisma.js';
import { createError } from './errorHandler.js';

/**
 * validateConnectionAccess
 * Ensures the requesting user is either the investor or seeker in the connection.
 * Attaches connection to req.connection for downstream use.
 */
export const validateConnectionAccess = async (req, res, next) => {
  try {
    const connection_id = req.params.id || req.params.connection_id || req.body.connection_id;
    if (!connection_id) throw createError(400, 'connection_id is required');

    const connection = await prisma.connection.findUnique({
      where:   { id: connection_id },
      include: {
        listing:  { select: { id: true, name: true, capital_seeker_id: true } },
        investor: { select: { id: true, name: true, email: true } },
        seeker:   { select: { id: true, name: true, email: true } },
      },
    });

    if (!connection) throw createError(404, 'Connection not found');

    const userId = req.user.id;
    const isMember = connection.investor_id === userId || connection.seeker_id === userId;
    if (!isMember) throw createError(403, 'You are not part of this connection');

    req.connection = connection;
    next();
  } catch (err) { next(err); }
};

/**
 * validateAcceptedInterest
 * Ensures the investor has an ACCEPTED interest in the given startup listing.
 * Uses startup_id from req.params or req.body.
 */
export const validateAcceptedInterest = async (req, res, next) => {
  try {
    const startup_id  = req.params.startup_id || req.params.startupId || req.body.startup_id;
    const investor_id = req.user.id;

    if (!startup_id) throw createError(400, 'startup_id is required');

    const interest = await prisma.interest.findUnique({
      where: { investor_id_startup_id: { investor_id, startup_id } },
    });

    if (!interest || interest.status !== 'ACCEPTED') {
      throw createError(403, 'You must have an accepted interest to access this resource');
    }

    req.interest = interest;
    next();
  } catch (err) { next(err); }
};
