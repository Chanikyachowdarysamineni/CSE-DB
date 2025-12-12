// CRUD API for Events
const express = require('express');
const router = express.Router();
const { pool } = require('../models/Event');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM events ORDER BY start_date DESC');
  res.json(result.rows);
});

// Create event
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  const { title, description, start_date, end_date, location, rsvp_list, reminders, recurring, waitlist } = req.body;
  const result = await pool.query(
    'INSERT INTO events (title, description, start_date, end_date, location, rsvp_list, reminders, recurring, waitlist) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
    [title, description, start_date, end_date, location, rsvp_list, reminders, recurring, waitlist]
  );
  res.json(result.rows[0]);
});

// Update event
router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  const { id } = req.params;
  const { title, description, start_date, end_date, location, reminders, recurring } = req.body;
  const result = await pool.query(
    'UPDATE events SET title=$1, description=$2, start_date=$3, end_date=$4, location=$5, reminders=$6, recurring=$7 WHERE id=$8 RETURNING *',
    [title, description, start_date, end_date, location, reminders, recurring, id]
  );
  res.json(result.rows[0]);
});

// Delete event
router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM events WHERE id=$1', [id]);
  res.sendStatus(204);
});

module.exports = router;
