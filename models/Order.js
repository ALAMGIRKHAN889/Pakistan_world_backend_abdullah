const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String, image: String, category: String, qty: Number, price: Number,
    options: [{ name: String, label: String }],
  }],
  shipping: { name: String, email: String, phone: String, street: String, city: String, postal: String, country: String, notes: String },
  delivery: { type: String, enum: ['standard', 'express'], default: 'standard' },
  paymentMethod: { type: String, enum: ['card', 'cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  cardLast4: String,
  coupon: String,
  subtotal: Number, discount: Number, shippingFee: Number, tax: Number, total: Number,
  status: { type: String, enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'placed', index: true },
  timeline: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
