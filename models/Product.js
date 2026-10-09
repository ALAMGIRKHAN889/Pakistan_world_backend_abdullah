const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String, rating: { type: Number, min: 1, max: 5, required: true }, comment: String,
}, { timestamps: true });

const optionSchema = new mongoose.Schema({
  name: String,            // e.g. "Case finish"
  values: [{ label: String, priceDelta: { type: Number, default: 0 } }],
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  brand: { type: String, default: 'AURA Atelier' },
  category: { type: String, enum: ['watches', 'cosmetics', 'jewelry', 'toys'], required: true, index: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, default: 0 },
  images: [String],
  stock: { type: Number, default: 0, min: 0 },
  sku: String,
  tags: [String],
  badge: String,
  specs: [{ label: String, value: String }],
  options: [optionSchema],
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
}, { timestamps: true });

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

productSchema.pre('validate', async function () {
  if (!this.slug || this.isModified('name')) {
    let base = slugify(this.name), slug = base, i = 1;
    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) slug = `${base}-${++i}`;
    this.slug = slug;
  }
});
productSchema.methods.recalc = function () {
  this.numReviews = this.reviews.length;
  this.rating = this.numReviews ? +(this.reviews.reduce((a, r) => a + r.rating, 0) / this.numReviews).toFixed(1) : 0;
};
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
