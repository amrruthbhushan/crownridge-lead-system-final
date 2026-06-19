import express from 'express';
import { getDashboardStats, getDatabaseSchemaStats } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getDashboardStats);
router.get('/db-schema-stats', authenticateToken, getDatabaseSchemaStats);

export default router;
