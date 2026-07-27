import { verifyAccessToken } from '../utils/jwt.js';
import { createError }       from './errorHandler.js';
import prisma                from '../utils/prisma.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw createError(401, 'No token provided');
    const token   = header.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user    = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw createError(401, 'User not found');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      return next(createError(401, 'Invalid or expired token'));
    next(err);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return next(createError(403, 'Forbidden'));
  next();
};
