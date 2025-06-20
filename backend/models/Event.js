const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  stopTime: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  selectedData: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  ],
  fileData: { type: Array, required: false },
  candidateImages: [
    {
      candidateIndex: Number,
      uuid: String,
      cdnUrl: String,
    },
  ],
  expiry: { type: Number, required: true },
  link: { type: String, required: true },
});

module.exports = mongoose.model('Event', eventSchema);