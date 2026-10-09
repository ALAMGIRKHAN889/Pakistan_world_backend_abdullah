const os = require('os');
const path = require('path');
const fs = require('fs');
// Vercel's file system is read-only except /tmp (temporary – files disappear). Locally we use ./uploads.
const dir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, 'uploads');
fs.mkdirSync(dir, { recursive: true });
module.exports = dir;
