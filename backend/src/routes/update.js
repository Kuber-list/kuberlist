import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { postUpdate, getUpdates } from '../controllers/update.js';
const r = Router();
r.post('/',                    protect, requireRole('CAPITAL_SEEKER'), postUpdate);
r.get('/startup/:startupId',   getUpdates);
export default r;
