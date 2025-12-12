const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Announcement = require('../models/Announcement');

// Get all announcements (role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'Student') {
      // Students see only approved announcements
      query = { status: 'approved' };
    } else if (role === 'Faculty') {
      // Faculty see their own + approved
      query = { $or: [{ sender_id: id }, { status: 'approved' }] };
    }
    // HOD/DEAN see all (no filter)

    const announcements = await Announcement.find(query)
      .populate('sender_id', 'name email role')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('sender_id', 'name email role');
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Create announcement
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { title, body, priority, expiry, subject_name, subject_code, attachments } = req.body;
    
    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    const sender_id = req.user.id;
    const status = req.user.role === 'Faculty' ? 'pending' : 'approved';

    const announcement = await Announcement.create({
      title,
      body,
      priority: priority || 'medium',
      expiry,
      status,
      sender_id,
      subject_name,
      subject_code,
      attachments: attachments || []
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement:new', announcement);
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (approve/edit)
router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, priority, expiry, status, subject_name, subject_code } = req.body;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const announcement = await Announcement.findById(id);
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      if (announcement.sender_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this announcement' });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (body) updateData.body = body;
    if (priority) updateData.priority = priority;
    if (expiry) updateData.expiry = expiry;
    if (status) updateData.status = status;
    if (subject_name) updateData.subject_name = subject_name;
    if (subject_code) updateData.subject_code = subject_code;

    const announcement = await Announcement.findByIdAndUpdate(id, updateData, { new: true });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement:updated', announcement);
    }

    res.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement
router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const announcement = await Announcement.findById(id);
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      if (announcement.sender_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this announcement' });
      }
    }
    
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
