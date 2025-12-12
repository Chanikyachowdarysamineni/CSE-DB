const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  expiry_date: Date,
  type: String,
  venue: String,
  capacity: { type: Number, default: 50 },
  attendees: { type: Number, default: 0 },
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  recurring: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject_name: String,
  subject_code: String,
  google_calendar_link: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
