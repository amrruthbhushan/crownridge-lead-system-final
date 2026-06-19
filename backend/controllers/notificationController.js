import prisma from '../services/db.js';

/**
 * Get all notifications for logged in user
 */
export async function getUserNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({ notifications });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return res.status(500).json({ error: 'Server error fetching notifications.' });
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(req, res) {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify another user\'s notifications.' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.json({ message: 'Notification marked as read', notification: updatedNotification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Server error updating notification.' });
  }
}

/**
 * Mark all notifications as read for logged in user
 */
export async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Server error updating notifications.' });
  }
}
