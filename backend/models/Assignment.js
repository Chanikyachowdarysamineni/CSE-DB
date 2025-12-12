const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: { type: Date, required: true },
  type: { type: String, default: 'Assignment' },
  subject_name: { type: String, required: true },
  subject_code: { type: String, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{ name: String, url: String, size: Number, type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file_name: String,
  file_size: Number,
  submitted_at: { type: Date, default: Date.now },
  is_late: { type: Boolean, default: false },
  resubmissions: { type: Number, default: 0 },
  grade: String,
  feedback: String
}, { timestamps: true });

module.exports = {
  Assignment: mongoose.model('Assignment', assignmentSchema),
  Submission: mongoose.model('Submission', submissionSchema)
};
