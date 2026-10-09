const router = require('express').Router();
const User = require('../models/User');
const { sign, protect } = require('../middleware/auth');

const pub = (u) => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, addresses: u.addresses, wishlist: u.wishlist });

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists' });
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({ token: sign(user), user: pub(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matches(password || ''))) return res.status(401).json({ message: 'Invalid email or password' });
  if (user.blocked) return res.status(403).json({ message: 'This account has been suspended' });
  res.json({ token: sign(user), user: pub(user) });
});

router.get('/me', protect, (req, res) => res.json({ user: pub(req.user) }));

router.put('/me', protect, async (req, res) => {
  const { name, phone, password, addresses } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (Array.isArray(addresses)) req.user.addresses = addresses;
  if (password) {
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const u = await User.findById(req.user._id).select('+password'); u.password = password;
    u.name = req.user.name; u.phone = req.user.phone; u.addresses = req.user.addresses;
    await u.save(); return res.json({ user: pub(u) });
  }
  await req.user.save();
  res.json({ user: pub(req.user) });
});

module.exports = router;
