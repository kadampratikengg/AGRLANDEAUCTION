const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  businessName: String,
  ownerName: String,
  contactNumber: String,
  email: String,
  deliveryAddress: String,
  state: String,
  district: String,
  taluka: String,
  pincode: String,
  items: [
    {
      weight: String,
      quantity: Number,
    },
  ],
});

module.exports = mongoose.model('Order', orderSchema);