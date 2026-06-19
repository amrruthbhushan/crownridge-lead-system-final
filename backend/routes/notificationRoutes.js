import express from 'express';
import { getUserNotifications, markNotificationAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserNotifications);
router.put('/:id', markNotificationAsRead);
router.post('/mark-all-read', markAllAsRead);

export default router;
