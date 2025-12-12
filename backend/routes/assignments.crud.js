// CRUD API for Assignments
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Assignment');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all assignments
router.get('/', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM assignments ORDER BY deadline DESC');
  res.json(result.rows);
});

// Create assignment
router.post('/', authenticateToken, authorizeRoles('Faculty'), async (req, res) => {
  const { course_id, title, description, deadline, submissions, grading, materials } = req.body;
  const result = await pool.query(
    'INSERT INTO assignments (course_id, title, description, deadline, submissions, grading, materials) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [course_id, title, description, deadline, submissions, grading, materials]
  );
  res.json(result.rows[0]);
});

// Update assignment
router.put('/:id', authenticateToken, authorizeRoles('Faculty'), async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, grading, materials } = req.body;
  const result = await pool.query(
    'UPDATE assignments SET title=$1, description=$2, deadline=$3, grading=$4, materials=$5 WHERE id=$6 RETURNING *',
    [title, description, deadline, grading, materials, id]
  );
  res.json(result.rows[0]);
});

// Delete assignment
router.delete('/:id', authenticateToken, authorizeRoles('Faculty'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM assignments WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
