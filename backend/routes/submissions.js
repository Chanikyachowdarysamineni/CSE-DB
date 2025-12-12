const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Assignment, Submission } = require('../models/Assignment');

router.get('/my', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ student_id: req.user.id })
      .populate('assignment_id', 'title deadline')
      .sort({ submitted_at: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.post('/', authenticateToken, authorizeRoles('Student'), async (req, res) => {
  try {
    const { assignment_id, file_name, file_path } = req.body;
    
    const assignment = await Assignment.findById(assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const is_late = new Date() > new Date(assignment.deadline);
    
    const existing = await Submission.findOne({ assignment_id, student_id: req.user.id });
    
    if (existing) {
      existing.file_name = file_name;
      existing.file_path = file_path;
      existing.is_late = is_late;
      existing.resubmissions += 1;
      existing.submitted_at = new Date();
      await existing.save();
      res.json(existing);
    } else {
      const submission = await Submission.create({
        assignment_id,
        student_id: req.user.id,
        file_name,
        file_path,
        is_late
      });
      
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('submission:new', submission);
      }
      
      res.status(201).json(submission);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

router.put('/:id/grade', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, feedback, graded_at: new Date() },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

module.exports = router;
