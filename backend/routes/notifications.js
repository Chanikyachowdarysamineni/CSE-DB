const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(100);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create notification (for Faculty/HOD/DEAN to send to students)
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { title, message, type, priority, recipient_ids } = req.body;
    
    const notifications = [];
    for (const userId of recipient_ids) {
      // Check for duplicate within last 5 seconds
      const recentDuplicate = await Notification.findOne({
        user_id: userId,
        title,
        message,
        created_at: { $gte: new Date(Date.now() - 5000) }
      });

      if (recentDuplicate) {
        console.log('Duplicate notification prevented:', title);
        notifications.push(recentDuplicate);
        continue;
      }

      const notification = await Notification.create({
        user_id: userId,
        title,
        message,
        type: type || 'general',
        priority: priority || 'medium',
        read: false
      });
      notifications.push(notification);
      
      // Emit real-time update immediately after creation
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${userId}`).emit('notification:new', notification);
      }
    }
    
    res.status(201).json(notifications);
  } catch (error) {
    console.error('Notification creation error:', error);
    res.status(500).json({ error: 'Failed to create notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { read: true, read_at: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, read: false },
      { read: true, read_at: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Clear all notifications
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({ user_id: req.user.id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

module.exports = router;
