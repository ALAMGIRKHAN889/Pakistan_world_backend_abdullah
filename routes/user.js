const router = require('express').Router();
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Subscriber = require('../models/Subscriber');
const { protect } = require('../middleware/auth');

router.get('/wishlist', protect, async (req, res) => {
  const u = await User.findById(req.user._id).populate('wishlist', '-reviews -specs -options -description');
  res.json({ items: u.wishlist.filter(Boolean) });
});
router.post('/wishlist/:id', protect, async (req, res) => {
  const id = req.params.id, has = req.user.wishlist.some(w => String(w) === id);
  if (has) req.user.wishlist.pull(id); else req.user.wishlist.push(id);
  await req.user.save();
  res.json({ wishlist: req.user.wishlist, added: !has });
});

router.post('/coupons/validate', async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const c = await Coupon.findOne({ code: (code || '').toUpperCase(), active: true });
  if (!c || (c.expiresAt && c.expiresAt < new Date())) return res.status(404).json({ message: 'This code is not valid' });
  if (subtotal < c.minSubtotal) return res.status(400).json({ message: `Minimum spend of $${c.minSubtotal} required` });
  const discount = c.type === 'percent' ? +(subtotal * c.value / 100).toFixed(2) : Math.min(c.value, subtotal);
  res.json({ code: c.code, type: c.type, value: c.value, discount });
});

router.post('/subscribe', async (req, res) => {
  const email = (req.body.email || '').toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email' });
  await Subscriber.updateOne({ email }, { email }, { upsert: true });
  res.json({ ok: true });
});

module.exports = router;
