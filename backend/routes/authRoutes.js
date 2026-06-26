import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, getSalesReps } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Rate limiters for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                    // 20 requests per window per IP
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 registration attempts per 15 min per IP
  message: { error: 'Too many registration attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (with rate limiting)
router.post('/register', registerLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/sales-reps', authenticateToken, getSalesReps);

export default router;
