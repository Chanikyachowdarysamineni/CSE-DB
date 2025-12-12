// CRUD API for Analytics
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Analytics');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get analytics summary (role-based)
router.get('/summary', authenticateToken, async (req, res) => {
  const role = req.user.role;
  let result;
  if (role === 'HOD' || role === 'DEAN') {
    result = await pool.query('SELECT * FROM analytics');
  } else if (role === 'Faculty') {
    result = await pool.query('SELECT * FROM analytics WHERE faculty_id=$1', [req.user.id]);
  } else {
    result = await pool.query('SELECT * FROM analytics WHERE student_id=$1', [req.user.id]);
  }
  res.json(result.rows);
});

// Create analytics record
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN'), async (req, res) => {
  const { type, data, faculty_id, student_id, period } = req.body;
  const result = await pool.query(
    'INSERT INTO analytics (type, data, faculty_id, student_id, period) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [type, data, faculty_id, student_id, period]
  );
  res.json(result.rows[0]);
});

// Update analytics record
router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN'), async (req, res) => {
  const { id } = req.params;
  const { type, data, period } = req.body;
  const result = await pool.query(
    'UPDATE analytics SET type=$1, data=$2, period=$3 WHERE id=$4 RETURNING *',
    [type, data, period, id]
  );
  res.json(result.rows[0]);
});

// Delete analytics record
router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM analytics WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
