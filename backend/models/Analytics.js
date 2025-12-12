const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event_type: { type: String, required: true },
  event_data: { type: Map, of: mongoose.Schema.Types.Mixed },
  page: String,
  action: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
