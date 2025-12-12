// CRUD API for Announcements
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Announcement');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all announcements
router.get('/', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
  res.json(result.rows);
});

// Create announcement
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  const { title, body, sender_id, recipients, priority, expiry, status, pinned } = req.body;
  const result = await pool.query(
    'INSERT INTO announcements (title, body, sender_id, recipients, priority, expiry, status, pinned) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [title, body, sender_id, recipients, priority, expiry, status, pinned]
  );
  res.json(result.rows[0]);
});

// Update announcement
router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  const { id } = req.params;
  const { title, body, priority, expiry, status, pinned } = req.body;
  const result = await pool.query(
    'UPDATE announcements SET title=$1, body=$2, priority=$3, expiry=$4, status=$5, pinned=$6 WHERE id=$7 RETURNING *',
    [title, body, priority, expiry, status, pinned, id]
  );
  res.json(result.rows[0]);
});

// Delete announcement
router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM announcements WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
