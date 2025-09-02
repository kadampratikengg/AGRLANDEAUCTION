const mongoose = require('mongoose');

const subUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  profilePic: { type: String }, // Stores Uploadcare UUID for the profile picture
  permissions: [{ type: String }], // e.g., ['/voting/:eventId', '/manage']
});

module.exports = mongoose.model('SubUser', subUserSchema);