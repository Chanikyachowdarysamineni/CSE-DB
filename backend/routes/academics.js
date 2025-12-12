const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', (req, res) => {
  res.send('Get academic materials');
});

router.post('/assignment', authenticateToken, authorizeRoles('Faculty'), (req, res) => {
  res.send('Create assignment');
});

module.exports = router;
