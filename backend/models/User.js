const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: {
    planDuration: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isValid: { type: Boolean, default: false },
    amount: { type: Number },
    paymentId: { type: String },
    orderId: { type: String }
  },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }, // Reference to Profile model
  subUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubUser' }], // Reference to SubUser model
});

module.exports = mongoose.model('User', userSchema);