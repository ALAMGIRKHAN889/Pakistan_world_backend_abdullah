const mongoose = require('mongoose');
module.exports = mongoose.model('Subscriber', new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
}, { timestamps: true }));
