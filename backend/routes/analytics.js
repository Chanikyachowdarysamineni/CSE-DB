const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', (req, res) => {
  res.send('Get analytics data');
});

module.exports = router;
