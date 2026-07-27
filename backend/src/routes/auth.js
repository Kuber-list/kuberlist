import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
const r = Router();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [CAPITAL_SEEKER, INVESTOR] }
 *     responses:
 *       201: { description: User registered }
 *       409: { description: Email already registered }
 */
r.post('/register', register);
r.post('/login', login);
r.post('/refresh', refresh);
r.post('/logout', logout);
r.get('/me', protect, me);
export default r;
