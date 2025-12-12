// CRUD API for Resources
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Resource');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all resources
router.get('/', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM resources ORDER BY created_at DESC');
  res.json(result.rows);
});

// Upload resource
router.post('/', authenticateToken, authorizeRoles('Faculty', 'Student'), async (req, res) => {
  const { name, type, folder, version, uploaded_by, preview_url } = req.body;
  const result = await pool.query(
    'INSERT INTO resources (name, type, folder, version, uploaded_by, preview_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, type, folder, version, uploaded_by, preview_url]
  );
  res.json(result.rows[0]);
});

// Update resource
router.put('/:id', authenticateToken, authorizeRoles('Faculty', 'Student'), async (req, res) => {
  const { id } = req.params;
  const { name, type, folder, version, preview_url } = req.body;
  const result = await pool.query(
    'UPDATE resources SET name=$1, type=$2, folder=$3, version=$4, preview_url=$5 WHERE id=$6 RETURNING *',
    [name, type, folder, version, preview_url, id]
  );
  res.json(result.rows[0]);
});

// Delete resource
router.delete('/:id', authenticateToken, authorizeRoles('Faculty'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM resources WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
