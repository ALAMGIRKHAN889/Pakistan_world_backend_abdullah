require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connect = require('./db');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
// CLIENT_URL = comma-separated list of frontend addresses allowed to call this API
const origins = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean).concat(['http://localhost:5173']);
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/uploads', express.static(require('./uploadDir')));

// Connect to MongoDB once (re-used between requests; needed for serverless hosts like Vercel)
let ready;
const init = () => (ready ||= connect().then(() => require('./seed').ensureSeed()).catch((e) => { ready = null; throw e; }));
app.use(async (_req, _res, next) => {
  const missing = ['JWT_SECRET', ...(process.env.VERCEL ? ['MONGODB_URI'] : [])].filter((k) => !process.env[k]);
  if (missing.length) return next(Object.assign(new Error(`Server setup incomplete: set ${missing.join(' and ')} in the backend environment variables, then redeploy.`), { status: 500 }));
  try { await init(); next(); } catch (e) { next(e); }
});

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/me', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/health', async (_req, res) => {
  const mongoose = require('mongoose');
  res.json({
    ok: true,
    storage: connect.memory ? 'MEMORY (data is lost on restart!)' : 'mongodb',
    database: mongoose.connection.name,
    users: await require('./models/User').countDocuments(),
    products: await require('./models/Product').countDocuments(),
  });
});

app.get('/', (_req, res) => res.json({ name: 'Products World API', health: '/api/health' }));

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  init()
    .then(() => app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT}`)))
    .catch((e) => { console.error('✗ Could not start:', e.message); process.exit(1); });
}

module.exports = app;
