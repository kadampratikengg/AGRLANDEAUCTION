const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  businessName: String,
  ownerName: String,
  contactNumber: String,
  email: String,
  businessCategory: String,
  address: String,
  state: String,
  district: String,
  taluka: String,
  pincode: String,
});

module.exports = mongoose.model('Contact', contactSchema);