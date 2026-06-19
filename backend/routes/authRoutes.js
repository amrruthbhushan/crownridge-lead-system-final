import express from 'express';
import { register, login, getProfile, getSalesReps } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/sales-reps', authenticateToken, getSalesReps);

export default router;
