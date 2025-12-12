const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Resource = require('../models/Resource');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const resources = await Resource.find().populate('uploaded_by', 'name email').sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('uploaded_by', 'name email');
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, uploaded_by: req.user.id });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('resource:new', resource);
    }
    
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

module.exports = router;
