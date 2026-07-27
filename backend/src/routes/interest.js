import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { sendInterest, getInterestsForStartup, updateInterestStatus, getMyInterests } from '../controllers/interest.js';
const r = Router();
r.post('/send',                     protect, requireRole('INVESTOR'),       sendInterest);
r.get('/mine',                      protect, requireRole('INVESTOR'),       getMyInterests);
r.get('/startup/:startupId',        protect, requireRole('CAPITAL_SEEKER'), getInterestsForStartup);
r.put('/:id/status',                protect, requireRole('CAPITAL_SEEKER'), updateInterestStatus);
export default r;
