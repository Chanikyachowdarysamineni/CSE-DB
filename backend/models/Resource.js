const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  folder: String,
  subject_name: { type: String, required: true },
  subject_code: { type: String, required: true },
  version: { type: String, default: 'v1.0' },
  link: String,
  file_path: String,
  downloads: { type: Number, default: 0 },
  expiry_date: Date,
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
