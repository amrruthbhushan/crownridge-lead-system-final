import express from 'express';
import { getReportsSummary, exportReportCSV } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getReportsSummary);
router.get('/export', authenticateToken, exportReportCSV);

export default router;
