import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validateConnectionAccess } from '../middleware/connection.js';
import { sendMessage, getMessages, getUnreadCount } from '../controllers/message.js';

const r = Router();

// GET /messages/unread-count — total unread across all connections
r.get('/unread-count', protect, getUnreadCount);

// POST /messages — send a message
r.post('/', protect, (req, res, next) => {
  req.params.connection_id = req.body.connection_id;
  next();
}, validateConnectionAccess, sendMessage);

// GET /messages/:connection_id — get messages (also marks as read)
r.get('/:connection_id', protect, validateConnectionAccess, getMessages);

export default r;
