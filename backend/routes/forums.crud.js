// CRUD API for Forums
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Forum');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all threads
router.get('/', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM forums ORDER BY created_at DESC');
  res.json(result.rows);
});

// Create thread
router.post('/', authenticateToken, authorizeRoles('Faculty', 'Student'), async (req, res) => {
  const { topic, body, category, author_id, replies, anonymous } = req.body;
  const result = await pool.query(
    'INSERT INTO forums (topic, body, category, author_id, replies, anonymous) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [topic, body, category, author_id, replies, anonymous]
  );
  res.json(result.rows[0]);
});

// Update thread
router.put('/:id', authenticateToken, authorizeRoles('Faculty', 'Student'), async (req, res) => {
  const { id } = req.params;
  const { topic, body, category, replies, accepted_solution, anonymous } = req.body;
  const result = await pool.query(
    'UPDATE forums SET topic=$1, body=$2, category=$3, replies=$4, accepted_solution=$5, anonymous=$6 WHERE id=$7 RETURNING *',
    [topic, body, category, replies, accepted_solution, anonymous, id]
  );
  res.json(result.rows[0]);
});

// Delete thread
router.delete('/:id', authenticateToken, authorizeRoles('Faculty'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM forums WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
