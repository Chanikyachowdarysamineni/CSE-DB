const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Assignment, Submission } = require('../models/Assignment');

// Get all assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'Student') {
      // Students see only approved assignments
      query = { status: 'approved' };
    } else if (role === 'Faculty') {
      // Faculty see their own + approved
      query = { $or: [{ created_by: id }, { status: 'approved' }] };
    }
    // HOD/DEAN see all (no filter)

    const assignments = await Assignment.find(query)
      .populate('created_by', 'name email role')
      .sort({ deadline: -1 });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('created_by', 'name email role');
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create assignment
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { title, description, deadline, type, subject_name, subject_code, attachments } = req.body;
    
    // Validate required fields
    if (!title || !deadline || !subject_name || !subject_code) {
      return res.status(400).json({ error: 'Title, deadline, subject name, and subject code are required' });
    }
    
    const assignment = await Assignment.create({
      title,
      description,
      deadline,
      type,
      subject_name,
      subject_code,
      created_by: req.user.id,
      attachments: attachments || []
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('assignment:new', assignment);
    }

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment
router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, type, subject_name, subject_code } = req.body;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      if (assignment.created_by.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this assignment' });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (deadline) updateData.deadline = deadline;
    if (type) updateData.type = type;
    if (subject_name) updateData.subject_name = subject_name;
    if (subject_code) updateData.subject_code = subject_code;

    const assignment = await Assignment.findByIdAndUpdate(id, updateData, { new: true });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      if (assignment.created_by.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this assignment' });
      }
    }
    
    // Delete all submissions for this assignment first
    await Submission.deleteMany({ assignment_id: id });
    
    const assignment = await Assignment.findByIdAndDelete(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Get submissions for an assignment
router.get('/:id/submissions', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await Submission.find({ assignment_id: id })
      .populate('student_id', 'name registration_id')
      .sort({ submitted_at: -1 });
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

module.exports = router;
