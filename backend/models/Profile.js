const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  organization: { type: String },
  logo: { type: String }, // Stores Uploadcare UUID for the logo
  contact: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  state: { type: String },
  district: { type: String },
  pincode: { type: String },
  gstNumber: { type: String },
});

module.exports = mongoose.model('Profile', profileSchema);