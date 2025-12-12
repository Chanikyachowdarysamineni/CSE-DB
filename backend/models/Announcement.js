const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  expiry: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_name: String,
  subject_code: String,
  attachments: [{ name: String, url: String, size: Number, type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
