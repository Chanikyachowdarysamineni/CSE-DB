// CRUD API for Projects
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Project');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
  res.json(result.rows);
});

// Create project
router.post('/', authenticateToken, authorizeRoles('Faculty', 'Student'), async (req, res) => {
  const { title, description, proposal, progress, milestones, team, evaluation } = req.body;
  const result = await pool.query(
    'INSERT INTO projects (title, description, proposal, progress, milestones, team, evaluation) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [title, description, proposal, progress, milestones, team, evaluation]
  );
  res.json(result.rows[0]);
});

// Update project
router.put('/:id', authenticateToken, authorizeRoles('Faculty', 'Student'), async (req, res) => {
  const { id } = req.params;
  const { title, description, proposal, progress, milestones, evaluation } = req.body;
  const result = await pool.query(
    'UPDATE projects SET title=$1, description=$2, proposal=$3, progress=$4, milestones=$5, evaluation=$6 WHERE id=$7 RETURNING *',
    [title, description, proposal, progress, milestones, evaluation, id]
  );
  res.json(result.rows[0]);
});

// Delete project
router.delete('/:id', authenticateToken, authorizeRoles('Faculty'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM projects WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
