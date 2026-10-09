const mongoose = require('mongoose');
module.exports = mongoose.model('Coupon', new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value: { type: Number, required: true },
  minSubtotal: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  expiresAt: Date,
  used: { type: Number, default: 0 },
}, { timestamps: true }));
