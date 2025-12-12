// CRUD API for Notifications
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Notification');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get notifications for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query('SELECT * FROM notifications WHERE recipient_id=$1 ORDER BY created_at DESC', [userId]);
  res.json(result.rows);
});

// Send notification
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  const { type, message, sender_id, recipient_id, channel, priority } = req.body;
  const result = await pool.query(
    'INSERT INTO notifications (type, message, sender_id, recipient_id, channel, priority) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [type, message, sender_id, recipient_id, channel, priority]
  );
  res.json(result.rows[0]);
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('UPDATE notifications SET read=true WHERE id=$1 RETURNING *', [id]);
  res.json(result.rows[0]);
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM notifications WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
