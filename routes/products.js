const router = require('express').Router();
const Product = require('../models/Product');
const { protect, optionalAuth } = require('../middleware/auth');

const LIST_FIELDS = '-reviews -specs -options -description';

router.get('/', async (req, res) => {
  const { category, q, sort = 'featured', min, max, minRating, badge, flag, page = 1, limit = 12, tag, inStock } = req.query;
  const f = { active: true };
  if (category && category !== 'all') f.category = { $in: category.split(',') };
  if (q && String(q).trim()) {
    // every word must match name, brand, category or a tag; special characters are escaped so typing "(" can't crash the query
    const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    f.$and = String(q).trim().split(/\s+/).slice(0, 6).map((t) => {
      const re = new RegExp(esc(t), 'i');
      return { $or: [{ name: re }, { brand: re }, { category: re }, { tags: re }] };
    });
  }
  if (min || max) f.price = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
  if (minRating) f.rating = { $gte: +minRating };
  if (tag) f.tags = tag;
  if (inStock === 'true') f.stock = { $gt: 0 };
  if (['trending', 'newArrival', 'bestSeller', 'featured'].includes(flag)) f[flag] = true;
  if (badge === 'sale') f.comparePrice = { $gt: 0 };
  const sorts = {
    featured: { featured: -1, sold: -1, createdAt: -1 }, newest: { createdAt: -1 },
    'price-asc': { price: 1 }, 'price-desc': { price: -1 }, rating: { rating: -1, numReviews: -1 }, popular: { sold: -1 },
  };
  const lim = Math.min(+limit || 12, 60), skip = (Math.max(+page, 1) - 1) * lim;
  const [items, total] = await Promise.all([
    Product.find(f).select(LIST_FIELDS).sort(sorts[sort] || sorts.featured).skip(skip).limit(lim),
    Product.countDocuments(f),
  ]);
  res.json({ items, total, page: +page, pages: Math.ceil(total / lim) });
});

router.get('/facets', async (_req, res) => {
  const [cats, lo, hi] = await Promise.all([
    Product.aggregate([{ $match: { active: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Product.findOne({ active: true }).sort({ price: 1 }).select('price'),
    Product.findOne({ active: true }).sort({ price: -1 }).select('price'),
  ]);
  res.json({ categories: cats, price: { min: lo?.price || 0, max: hi?.price || 1000 } });
});

router.get('/:slug', async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug, active: true });
  if (!p) return res.status(404).json({ message: 'Product not found' });
  const related = await Product.find({ active: true, _id: { $ne: p._id } }).select(LIST_FIELDS)
    .sort({ sold: -1 }).limit(60);
  const same = related.filter(r => r.category === p.category).slice(0, 4);
  const others = related.filter(r => r.category !== p.category).slice(0, 4);
  res.json({ product: p, related: same, complete: others });
});

router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Product not found' });
  if (!(+rating >= 1 && +rating <= 5)) return res.status(400).json({ message: 'Rating must be 1–5' });
  const existing = p.reviews.find(r => String(r.user) === String(req.user._id));
  if (existing) { existing.rating = +rating; existing.comment = comment; }
  else p.reviews.unshift({ user: req.user._id, name: req.user.name, rating: +rating, comment });
  p.recalc(); await p.save();
  res.status(201).json({ product: p });
});

module.exports = router;
