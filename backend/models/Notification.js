const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: String,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  read: { type: Boolean, default: false },
  read_at: Date,
  channel: { type: String, default: 'In-app' },
  link: String
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index for duplicate detection and efficient querying
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, title: 1, message: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
