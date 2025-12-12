const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  registration_id: { type: String, required: true, unique: true },
  employee_id: { type: String, sparse: true }, // For Faculty, HOD, DEAN
  role: { type: String, enum: ['Student', 'Faculty', 'HOD', 'DEAN'], default: 'Student' },
  department: { type: String, default: 'Computer Science' },
  phone: String,
  batch: String,
  profile_pic: String,
  settings: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
