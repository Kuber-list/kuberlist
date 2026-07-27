import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getNotifications, markRead, getUnreadCount } from '../controllers/notification.js';
const r = Router();
r.use(protect);
r.get('/',              getNotifications);
r.get('/unread-count',  getUnreadCount);
r.post('/mark-read',    markRead);
export default r;
