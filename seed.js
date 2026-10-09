require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Coupon = require('./models/Coupon');
const Order = require('./models/Order');
const img = require('./images.json');

const H = (i) => img.home[i], S = (i) => img.shop[i], P = (i) => img.pdp[i];

const watchSpecs = (movement, case_, glass, water) => [
  { label: 'Movement & Calibre', value: movement }, { label: 'Case Architecture', value: case_ },
  { label: 'Glass & Dial', value: glass }, { label: 'Water Resistance', value: water },
];

const products = [
  // ── WATCHES
  { name: 'Chronos Obsidian Automatic 41mm', category: 'watches', brand: 'Aura Horology', price: 380, comparePrice: 520, stock: 4, badge: 'Limited Edition', featured: true, trending: true, bestSeller: true, sold: 148,
    images: [P(4), P(0), P(1), P(2), P(3)], tags: ['automatic', 'obsidian', 'limited'],
    description: 'A 41mm automatic chronograph with an obsidian PVD case, domed sapphire crystal and a Japanese Miyota 9015 calibre visible through the exhibition caseback. Finished by hand in small batches.',
    specs: watchSpecs('Japanese Miyota 9015 · 28,800 vph · 42h reserve', '316L surgical steel · 41mm · 11.2mm slim', 'Triple anti-reflective sapphire · Super-LumiNova BGW9', '10 ATM / 100 m · screw-down crown'),
    options: [{ name: 'Case finish', values: [{ label: 'Obsidian PVD', priceDelta: 0 }, { label: 'Brushed Steel', priceDelta: 0 }, { label: 'Champagne', priceDelta: 20 }] },
              { name: 'Strap', values: [{ label: 'Italian Calfskin', priceDelta: 0 }, { label: 'Steel Jubilee', priceDelta: 45 }] }] },
  { name: 'Classic Silver Chronograph', category: 'watches', brand: 'Aura Horology', price: 245, comparePrice: 310, stock: 18, trending: true, bestSeller: true, sold: 96, images: [H(5), S(0), H(24)], tags: ['chronograph', 'steel'], description: 'A sunburst-dial chronograph in brushed stainless steel with sapphire crystal and a sweeping tri-compax layout.', specs: watchSpecs('Swiss-grade quartz chronograph', '316L steel · 40mm', 'Sapphire · sunburst dial', '5 ATM') },
  { name: 'Skeleton Obsidian Automatic', category: 'watches', brand: 'Aura Horology', price: 450, stock: 7, trending: true, featured: true, sold: 52, images: [H(6), H(13)], tags: ['skeleton', 'automatic'], description: 'Exposed escapement, rich matte-black coating and gold hour markers — mechanical drama on the wrist.', specs: watchSpecs('Automatic skeleton · 21 jewels', 'Matte black PVD steel · 42mm', 'Sapphire · open-worked dial', '5 ATM') },
  { name: 'Tuscan Leather Heritage Watch', category: 'watches', brand: 'Aura Horology', price: 195, stock: 22, newArrival: true, sold: 31, images: [H(20)], tags: ['leather', 'dress'], description: 'A warm cream dial on a Tuscan tan calfskin strap. Understated, dressy, timeless.', specs: watchSpecs('Japanese quartz', 'Steel · 38mm', 'Mineral crystal · cream dial', '3 ATM') },
  { name: 'Rose Gold Milanese Slim', category: 'watches', brand: 'Aura Horology', price: 215, comparePrice: 260, stock: 12, newArrival: true, sold: 40, images: [S(5)], tags: ['rose gold', 'mesh'], description: 'An ultra-thin rose gold case on a woven Milanese mesh bracelet.', specs: watchSpecs('Japanese quartz slim', 'Rose-gold PVD steel · 34mm', 'Sapphire coated · silver dial', '3 ATM') },
  { name: 'Titanium Aviator Matte Black', category: 'watches', brand: 'Aura Horology', price: 520, stock: 5, newArrival: true, featured: true, sold: 22, images: [S(9)], tags: ['titanium', 'aviator'], description: 'Matte obsidian titanium with luminescent green hands — precision engineering for the cockpit and the boardroom.', specs: watchSpecs('Automatic NH35', 'Grade-5 titanium · 43mm', 'Sapphire · luminescent hands', '10 ATM') },
  { name: 'Chrono Linen Minimalist', category: 'watches', brand: 'Aura Horology', price: 289, stock: 14, bestSeller: true, sold: 63, images: [H(24)], tags: ['chronograph', 'leather'], description: 'Automatic chronograph on a black leather strap with a clean, gallery-ready dial.', specs: watchSpecs('Automatic chronograph', 'Steel · 40mm', 'Sapphire', '5 ATM') },

  // ── COSMETICS
  { name: 'Botanical Radiance Glow Serum 50ml', category: 'cosmetics', brand: 'Aura Botanique', price: 54, comparePrice: 68, stock: 60, trending: true, bestSeller: true, featured: true, sold: 210, images: [H(7), S(1), H(25)], tags: ['serum', 'glow', 'vitamin c'], description: 'A cold-pressed botanical serum with hyaluronic acid and vitamin C that leaves skin dewy, plump and luminous.',
    specs: [{ label: 'Size', value: '50 ml / 1.7 fl oz' }, { label: 'Key actives', value: 'Hyaluronic acid · Vitamin C · Squalane' }, { label: 'Skin type', value: 'All skin types' }, { label: 'Free from', value: 'Parabens · sulphates · synthetic fragrance' }] },
  { name: 'Velvet Crimson Satin Lipstick', category: 'cosmetics', brand: 'Aura Botanique', price: 38, stock: 44, trending: true, sold: 120, images: [H(10), S(4)], tags: ['lipstick', 'satin'], description: 'Rich pigment in a heavyweight magnetic brass case. Satin finish, 8-hour comfort wear.', specs: [{ label: 'Finish', value: 'Satin' }, { label: 'Wear', value: '8 hours' }, { label: 'Net weight', value: '3.5 g' }] },
  { name: 'Rose Gold Eyeshadow Palette', category: 'cosmetics', brand: 'Aura Botanique', price: 64, comparePrice: 80, stock: 25, newArrival: true, sold: 58, images: [H(15)], tags: ['palette', 'eyeshadow'], description: 'Twelve shimmering rose gold, champagne and plum pigments with a double-ended brush.', specs: [{ label: 'Shades', value: '12' }, { label: 'Finish', value: 'Matte & shimmer' }] },
  { name: 'Rosehip Nocturnal Restoration Oil', category: 'cosmetics', brand: 'Aura Botanique', price: 72, stock: 30, newArrival: true, bestSeller: true, sold: 77, images: [H(21)], tags: ['oil', 'night'], description: 'A cold-pressed rosehip night oil that restores softness and tone while you sleep.', specs: [{ label: 'Size', value: '30 ml' }, { label: 'Use', value: 'Evening' }] },
  { name: 'Radiant Skin Tint Foundation', category: 'cosmetics', brand: 'Aura Botanique', price: 46, stock: 35, newArrival: true, sold: 44, images: [S(8)], tags: ['foundation', 'tint'], description: 'A sheer, buildable skin tint in a frosted glass pump — the look of skin, only better.', specs: [{ label: 'Coverage', value: 'Sheer to medium' }, { label: 'Size', value: '30 ml' }] },
  { name: 'Oud & Vetiver Restorative Balm', category: 'cosmetics', brand: 'Aura Botanique', price: 68, stock: 20, featured: true, sold: 36, images: [P(13), H(14)], tags: ['balm', 'oud'], description: 'A cold-pressed botanical conditioning balm in an amber glass jar.', specs: [{ label: 'Size', value: '60 ml' }, { label: 'Notes', value: 'Oud · vetiver · cedar' }] },

  // ── JEWELRY
  { name: '18k Gold Solitaire Pendant', category: 'jewelry', brand: 'Aura Orfèvrerie', price: 450, comparePrice: 540, stock: 8, trending: true, featured: true, bestSeller: true, sold: 88, images: [H(8), S(2)], tags: ['pendant', 'diamond', 'gold'], description: 'A radiant-cut solitaire diamond on a solid 18k yellow gold chain.', specs: [{ label: 'Metal', value: '18k solid yellow gold' }, { label: 'Stone', value: '0.30 ct lab-grown diamond · VS1' }, { label: 'Chain', value: '45 cm adjustable' }] },
  { name: 'Diamond Tennis Bracelet', category: 'jewelry', brand: 'Aura Orfèvrerie', price: 890, stock: 3, trending: true, featured: true, sold: 19, images: [H(11)], tags: ['bracelet', 'diamond'], description: 'A continuous row of brilliant-cut diamonds set in white gold.', specs: [{ label: 'Metal', value: '18k white gold' }, { label: 'Carat', value: '2.4 ct total' }] },
  { name: 'Celestial Crystal Drop Earrings', category: 'jewelry', brand: 'Aura Orfèvrerie', price: 120, comparePrice: 150, stock: 16, newArrival: true, sold: 47, images: [H(16)], tags: ['earrings', 'crystal'], description: 'Dangling celestial crystals in champagne gold.', specs: [{ label: 'Metal', value: '18k champagne-gold plated' }] },
  { name: 'Stackable Pavé Ring Trio', category: 'jewelry', brand: 'Aura Orfèvrerie', price: 340, stock: 10, bestSeller: true, sold: 51, images: [H(17)], tags: ['rings', 'stack'], description: 'Three stackable 18k yellow gold and pavé diamond rings.', specs: [{ label: 'Metal', value: '18k yellow gold' }] },
  { name: 'Aethel Gilded Titanium Cuff', category: 'jewelry', brand: 'Aura Orfèvrerie', price: 165, stock: 12, newArrival: true, sold: 28, images: [P(12), H(22)], tags: ['cuff', 'titanium'], description: 'Beveled architectural cuff in 18k champagne PVD titanium.', specs: [{ label: 'Metal', value: 'Titanium · 18k PVD' }] },
  { name: 'Huggie Pavé Hoop Earrings', category: 'jewelry', brand: 'Aura Orfèvrerie', price: 185, stock: 20, sold: 33, images: [S(6)], tags: ['hoops', 'pavé'], description: '14k gold huggie hoops with pavé diamonds.', specs: [{ label: 'Metal', value: '14k yellow gold' }] },
  { name: 'Akoya Pearl & Gold Bracelet', category: 'jewelry', brand: 'Aura Orfèvrerie', price: 275, stock: 9, sold: 21, images: [S(10)], tags: ['pearl', 'bracelet'], description: 'Japanese cultured Akoya pearls with an 18k white gold clasp.', specs: [{ label: 'Pearls', value: 'Akoya · 6.5 mm' }] },

  // ── TOYS
  { name: 'Montessori Architectural Blocks', category: 'toys', brand: 'Aura Curio', price: 55, stock: 40, trending: true, bestSeller: true, sold: 134, images: [H(12), S(3)], tags: ['blocks', 'wood', 'montessori'], description: 'Solid beechwood arches, columns and domes finished with non-toxic pigments.', specs: [{ label: 'Pieces', value: '42' }, { label: 'Age', value: '2+ years' }, { label: 'Material', value: 'FSC beechwood' }] },
  { name: 'HyperSpeed Drift RC Turbo Car', category: 'toys', brand: 'Aura Curio', price: 94, comparePrice: 120, stock: 18, trending: true, bestSeller: true, sold: 99, images: [H(9), H(26)], tags: ['rc', 'car'], description: 'Aerodynamic RC sports car with drift mode and LED underglow.', specs: [{ label: 'Battery', value: 'Rechargeable 7.4V' }, { label: 'Range', value: '80 m' }, { label: 'Age', value: '8+' }] },
  { name: 'Good Touch Heirloom Plush Bear', category: 'toys', brand: 'Aura Curio', price: 48, stock: 28, newArrival: true, sold: 61, images: [H(18)], tags: ['plush', 'organic'], description: 'Extremely soft organic-cotton teddy, made to be loved for decades.', specs: [{ label: 'Material', value: 'Organic cotton' }, { label: 'Age', value: '0+' }] },
  { name: 'RC Turbo Racing Buggy', category: 'toys', brand: 'Aura Curio', price: 79, stock: 15, newArrival: true, sold: 38, images: [H(19)], tags: ['rc', 'buggy'], description: 'Off-road RC buggy built for dirt tracks and dust.', specs: [{ label: 'Drive', value: '4WD' }] },
  { name: 'Precision Marble Run Engineering Set', category: 'toys', brand: 'Aura Curio', price: 62, stock: 21, sold: 42, images: [H(23)], tags: ['stem', 'wood'], description: 'Interlocking birchwood rails and polished steel marbles.', specs: [{ label: 'Pieces', value: '60' }] },
  { name: 'French Linen Heirloom Bunny', category: 'toys', brand: 'Aura Curio', price: 42, stock: 26, sold: 29, images: [S(7)], tags: ['plush', 'linen'], description: 'A hand-stitched linen bunny in oatmeal and sage organic cotton.', specs: [{ label: 'Material', value: 'Linen & organic cotton' }] },
  { name: 'Kinetic Brass Valet Tray', category: 'toys', brand: 'Aura Curio', price: 120, stock: 11, sold: 17, images: [P(14)], tags: ['desk', 'brass'], description: 'Magnetic weighted brass desk-play tray — a sculptural adult toy.', specs: [{ label: 'Material', value: 'Solid brass' }] },
  { name: 'Concept Vehicle RC Model', category: 'toys', brand: 'Aura Curio', price: 135, stock: 6, featured: true, sold: 14, images: [S(11)], tags: ['rc', 'collector'], description: 'Precision-engineered concept vehicle in matte sage and silver.', specs: [{ label: 'Scale', value: '1:18' }] },
].map((p, i) => ({ ...p, sku: `AUR-${p.category.slice(0, 3).toUpperCase()}-${String(1000 + i)}`, images: p.images.filter(Boolean) }));

const reviewers = ['Eleanor V.', 'Marcus T.', 'Sofia R.', 'Hiro N.', 'Amelia K.', 'Daniel P.'];
const comments = ['Exquisite craftsmanship — exactly as pictured.', 'Packaging felt like opening a jewellery box. Fast dispatch too.', 'Better than I expected for the price. Will buy again.', 'A gift that landed perfectly.', 'Beautiful finish and great quality.', 'Super impressed, the details are flawless.'];

async function ensureSeed({ reset = false } = {}) {
  if (reset) await Promise.all([Product.deleteMany(), Coupon.deleteMany(), Order.deleteMany()]);
  if (!(await Product.countDocuments())) {
    for (const [i, p] of products.entries()) {
      const doc = new Product(p);
      const n = 2 + (i % 4);
      for (let k = 0; k < n; k++) doc.reviews.push({ name: reviewers[(i + k) % 6], rating: k === 0 && i % 5 === 0 ? 4 : 5 - (k % 2 && i % 3 === 0 ? 1 : 0), comment: comments[(i + k) % 6] });
      doc.recalc(); await doc.save();
    }
    console.log(`✓ Seeded ${products.length} products`);
  }
  if (!(await Coupon.countDocuments())) {
    await Coupon.create([
      { code: 'AURAVIP', type: 'fixed', value: 40, minSubtotal: 100 },
      { code: 'WELCOME10', type: 'percent', value: 10 },
      { code: 'ATELIER20', type: 'percent', value: 20, minSubtotal: 300 },
    ]);
    console.log('✓ Seeded coupons: AURAVIP, WELCOME10, ATELIER20');
  }
  const email = (process.env.ADMIN_EMAIL || 'admin@auraatelier.com').toLowerCase();
  if (!(await User.exists({ email }))) {
    await User.create({ name: 'Atelier Admin', email, password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin' });
    console.log(`✓ Admin created: ${email}`);
  }
}

module.exports = { ensureSeed };

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI).then(() => ensureSeed({ reset: process.argv.includes('--reset') }))
    .then(() => { console.log('Done'); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
}
