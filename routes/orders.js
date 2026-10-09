const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');

const FEES = { standard: 0, express: 15 };
const FREE_SHIP_OVER = 150;

const orderNo = () => `AUR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;

function waLink(order) {
  const lines = [
    `🛎️ *NEW ORDER RECEIVED* - AURA Atelier`,
    `Order ID: #${order.orderNo}`,
    `Customer: ${order.shipping.name}`,
    `Phone: ${order.shipping.phone}`,
    `Items: ${order.items.map(i => `${i.name} (x${i.qty})`).join(', ')}`,
    `Total: $${order.total.toFixed(2)}`,
    `Payment: ${order.paymentMethod === 'card' ? `Card (**** ${order.cardLast4 || ''})` : 'Cash on Delivery'}`,
    `Address: ${order.shipping.street}, ${order.shipping.city}, ${order.shipping.country}`,
  ];
  return `https://wa.me/${process.env.ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

router.post('/', protect, async (req, res) => {
  const { items, shipping, delivery = 'standard', paymentMethod = 'cod', coupon, card } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Your bag is empty' });
  for (const k of ['name', 'phone', 'street', 'city', 'country']) if (!shipping?.[k]) return res.status(400).json({ message: `Shipping ${k} is required` });
  if (paymentMethod === 'card' && !/^\d{12,19}$/.test((card?.number || '').replace(/\s/g, ''))) return res.status(400).json({ message: 'Enter a valid card number' });

  const lines = [];
  for (const it of items) {
    const p = await Product.findById(it.productId);
    if (!p || !p.active) return res.status(400).json({ message: 'An item in your bag is no longer available' });
    const qty = Math.max(1, +it.qty || 1);
    if (p.stock < qty) return res.status(400).json({ message: `Only ${p.stock} left of "${p.name}"` });
    let unit = p.price; const opts = [];
    for (const sel of it.options || []) {
      const group = p.options.find(o => o.name === sel.name), val = group?.values.find(v => v.label === sel.label);
      if (val) { unit += val.priceDelta || 0; opts.push({ name: sel.name, label: sel.label }); }
    }
    lines.push({ p, qty, doc: { product: p._id, name: p.name, image: p.images[0], category: p.category, qty, price: unit, options: opts } });
  }
  const subtotal = +lines.reduce((a, l) => a + l.doc.price * l.qty, 0).toFixed(2);

  let discount = 0, couponCode;
  if (coupon) {
    const c = await Coupon.findOne({ code: coupon.toUpperCase(), active: true });
    if (c && (!c.expiresAt || c.expiresAt > new Date()) && subtotal >= c.minSubtotal) {
      discount = c.type === 'percent' ? +(subtotal * c.value / 100).toFixed(2) : Math.min(c.value, subtotal);
      couponCode = c.code; c.used += 1; await c.save();
    }
  }
  const shippingFee = delivery === 'express' ? FEES.express : 0;
  const total = +(subtotal - discount + shippingFee).toFixed(2);

  const order = await Order.create({
    orderNo: orderNo(), user: req.user._id, items: lines.map(l => l.doc), shipping: { ...shipping, email: shipping.email || req.user.email },
    delivery, paymentMethod, paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
    cardLast4: paymentMethod === 'card' ? card.number.replace(/\s/g, '').slice(-4) : undefined,
    coupon: couponCode, subtotal, discount, shippingFee, tax: 0, total,
    timeline: [{ status: 'placed', note: 'Order received' }],
  });
  await Promise.all(lines.map(l => Product.updateOne({ _id: l.p._id }, { $inc: { stock: -l.qty, sold: l.qty } })));
  res.status(201).json({ order, whatsapp: waLink(order) });
});

router.get('/mine', protect, async (req, res) => {
  res.json({ orders: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }) });
});
router.get('/:id', protect, async (req, res) => {
  const o = await Order.findById(req.params.id).catch(() => null);
  if (!o || (String(o.user) !== String(req.user._id) && req.user.role !== 'admin')) return res.status(404).json({ message: 'Order not found' });
  res.json({ order: o, whatsapp: waLink(o) });
});
router.post('/:id/cancel', protect, async (req, res) => {
  const o = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!o) return res.status(404).json({ message: 'Order not found' });
  if (!['placed', 'processing'].includes(o.status)) return res.status(400).json({ message: 'This order can no longer be cancelled' });
  o.status = 'cancelled'; o.timeline.push({ status: 'cancelled', note: 'Cancelled by customer' }); await o.save();
  await Promise.all(o.items.map(i => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty, sold: -i.qty } })));
  res.json({ order: o });
});

module.exports = router;
module.exports.waLink = waLink;
