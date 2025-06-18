const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  voterId: { type: String, required: true },
  candidate: { type: String, required: true },
  timestamp: { type: String, required: true },
});

module.exports = mongoose.model('Vote', voteSchema);