const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  content: { type: String, required: true },
  category: String,
  upvotes: { type: Number, default: 0 },
  accepted: { type: Boolean, default: false },
  anonymous: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  google_form_link: String,
  google_sheet_link: String,
  attachments: [{ name: String, url: String, size: Number, type: String }],
  replies: [{
    content: String,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subject_name: { type: String, required: true },
  subject_code: { type: String, required: true },
  google_form_link: { type: String, required: true },
  google_sheet_link: String,
  responses: { type: Number, default: 0 },
  expiry_date: Date,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = {
  Forum: mongoose.model('Forum', forumSchema),
  Form: mongoose.model('Form', formSchema)
};
