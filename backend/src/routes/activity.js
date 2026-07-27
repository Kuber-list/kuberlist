import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { logActivity } from '../controllers/activity.js';
const r = Router();
r.post('/', protect, logActivity);
export default r;
