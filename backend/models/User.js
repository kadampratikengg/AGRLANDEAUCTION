const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  organization: { type: String },
  logo: { type: String }, // Stores Uploadcare UUID for the logo
  contact: { type: String },
  phone: { type: String },
  address: { type: String },
  state: { type: String },
  district: { type: String },
  pincode: { type: String },
  gstNumber: { type: String },
  subscription: {
    planDuration: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isValid: { type: Boolean, default: false },
    amount: { type: Number },
    paymentId: { type: String },
    orderId: { type: String }
  },
  subscriptionHistory: [{
    planDuration: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isValid: { type: Boolean, default: false },
    amount: { type: Number },
    paymentId: { type: String },
    orderId: { type: String }
  }],
  subUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubUser' }], // Reference to SubUser model
});

module.exports = mongoose.model('User', userSchema);