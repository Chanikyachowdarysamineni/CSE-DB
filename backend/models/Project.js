const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: Date,
  due_date: Date,
  subject_name: { type: String, required: true },
  subject_code: { type: String, required: true },
  requirements: [String],
  team_members: [String],
  progress: { type: Number, default: 0 },
  milestone: String,
  evaluated: { type: Boolean, default: false },
  attachments: [{ name: String, url: String, size: Number, type: String }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
