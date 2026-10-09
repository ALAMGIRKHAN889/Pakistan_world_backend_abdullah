const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');
const { waLink } = require('./orders');

router.use(protect, adminOnly);

const upload = multer({
  storage: multer.diskStorage({
    destination: require('../uploadDir'),
    filename: (_r, f, cb) => cb(null, Date.now() + '-' + f.originalname.replace(/[^a-z0-9.]/gi, '_')),
  }),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => cb(null, /^image\//.test(f.mimetype)),
});
router.post('/upload', upload.array('images', 8), (req, res) =>
  res.json({ urls: (req.files || []).map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`) }));

router.get('/stats', async (_req, res) => {
  const since = new Date(Date.now() - 29 * 864e5); since.setHours(0, 0, 0, 0);
  const [allOrders, userCount, productCount, recent, lowStock, top] = await Promise.all([
    Order.find().select('total status items createdAt'),
    User.countDocuments({ role: 'user' }), Product.countDocuments(),
    Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
    Product.find({ stock: { $lte: 5 }, active: true }).select('name stock images category').sort({ stock: 1 }).limit(6),
    Product.find().sort({ sold: -1 }).limit(5).select('name sold price images category'),
  ]);
  const valid = allOrders.filter(o => o.status !== 'cancelled');
  const day = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const buckets = {};
  for (let i = 29; i >= 0; i--) buckets[day(new Date(Date.now() - i * 864e5))] = { revenue: 0, orders: 0 };
  const cat = {}, status = {};
  for (const o of allOrders) status[o.status] = (status[o.status] || 0) + 1;
  for (const o of valid) {
    const k = day(o.createdAt);
    if (buckets[k]) { buckets[k].revenue += o.total; buckets[k].orders += 1; }
    for (const i of o.items) { const c = cat[i.category] ||= { revenue: 0, units: 0 }; c.revenue += i.price * i.qty; c.units += i.qty; }
  }
  res.json({
    revenue: +valid.reduce((a, o) => a + o.total, 0).toFixed(2), orders: allOrders.length, customers: userCount, products: productCount,
    series: Object.entries(buckets).map(([date, v]) => ({ date, ...v })),
    byCategory: Object.entries(cat).map(([_id, v]) => ({ _id, ...v })),
    status: Object.entries(status).map(([_id, count]) => ({ _id, count })),
    recent, lowStock, top,
  });
});

/* products */
router.get('/products', async (req, res) => {
  const { q, category } = req.query, f = {};
  if (q) f.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (category) f.category = category;
  res.json({ items: await Product.find(f).select('-reviews').sort({ createdAt: -1 }) });
});
router.get('/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  p ? res.json({ product: p }) : res.status(404).json({ message: 'Not found' });
});
const clean = (b) => { const { reviews, rating, numReviews, sold, slug, _id, __v, ...rest } = b; return rest; };
router.post('/products', async (req, res) => res.status(201).json({ product: await Product.create(clean(req.body)) }));
router.put('/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  p.set(clean(req.body)); await p.save(); res.json({ product: p });
});
router.delete('/products/:id', async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

/* orders */
router.get('/orders', async (req, res) => {
  const { status, q } = req.query, f = {};
  if (status) f.status = status;
  if (q) f.$or = [{ orderNo: new RegExp(q, 'i') }, { 'shipping.name': new RegExp(q, 'i') }];
  res.json({ orders: await Order.find(f).sort({ createdAt: -1 }).limit(200).populate('user', 'name email') });
});
router.put('/orders/:id', async (req, res) => {
  const { status, paymentStatus, note } = req.body;
  const o = await Order.findById(req.params.id);
  if (!o) return res.status(404).json({ message: 'Not found' });
  if (status && status !== o.status) {
    if (status === 'cancelled' && o.status !== 'cancelled')
      await Promise.all(o.items.map(i => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty, sold: -i.qty } })));
    o.status = status; o.timeline.push({ status, note });
    if (status === 'delivered' && o.paymentMethod === 'cod') o.paymentStatus = 'paid';
  }
  if (paymentStatus) o.paymentStatus = paymentStatus;
  await o.save(); res.json({ order: o, whatsapp: waLink(o) });
});

/* customers */
router.get('/users', async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  const agg = await Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } }]);
  const m = Object.fromEntries(agg.map(a => [String(a._id), a]));
  res.json({ users: users.map(u => ({ ...u, password: undefined, orders: m[u._id]?.orders || 0, spent: m[u._id]?.spent || 0 })) });
});
router.put('/users/:id', async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: "You can't change your own account here" });
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'Not found' });
  if (req.body.blocked !== undefined) u.blocked = !!req.body.blocked;
  if (req.body.role) u.role = req.body.role;
  await u.save(); res.json({ user: u });
});

/* coupons */
router.get('/coupons', async (_req, res) => res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }) }));
router.post('/coupons', async (req, res) => {
  try { res.status(201).json({ coupon: await Coupon.create(req.body) }); }
  catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Code already exists' : e.message }); }
});
router.put('/coupons/:id', async (req, res) => res.json({ coupon: await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }) }));
router.delete('/coupons/:id', async (req, res) => { await Coupon.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

module.exports = router;
