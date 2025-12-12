// Route to initialize all tables (for setup)
const express = require('express');
const router = express.Router();

router.get('/init-tables', async (req, res) => {
  try {
    await require('../initTables');
    res.send('All tables initialized.');
  } catch (err) {
    res.status(500).send('Error initializing tables: ' + err.message);
  }
});

module.exports = router;
