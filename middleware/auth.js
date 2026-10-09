const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

async function loadUser(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    const u = await User.findById(id);
    return u && !u.blocked ? u : null;
  } catch { return null; }
}
const protect = async (req, res, next) => {
  const u = await loadUser(req);
  if (!u) return res.status(401).json({ message: 'Please sign in' });
  req.user = u; next();
};
const optionalAuth = async (req, _res, next) => { req.user = await loadUser(req); next(); };
const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only' });

module.exports = { sign, protect, optionalAuth, adminOnly };
