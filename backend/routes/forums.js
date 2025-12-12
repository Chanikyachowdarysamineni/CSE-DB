const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Forum } = require('../models/Forum');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const forums = await Forum.find()
      .populate('created_by', 'name email')
      .populate('replies.created_by', 'name email')
      .sort({ createdAt: -1 });
    res.json(forums);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const forum = await Forum.create({ ...req.body, created_by: req.user.id });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('forum:new', forum);
    }
    
    res.status(201).json(forum);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create forum post' });
  }
});

router.post('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ error: 'Forum post not found' });
    
    forum.replies.push({
      created_by: req.user.id,
      content: req.body.content
    });
    await forum.save();
    res.json(forum);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

module.exports = router;
