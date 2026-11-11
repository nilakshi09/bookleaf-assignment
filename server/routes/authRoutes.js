import express from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateLoginPayload } from '../middleware/validation.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', authLimiter, validateLoginPayload, login);
router.get('/me', verifyToken, getProfile);

export default router;
