const mongoose = require('mongoose');

async function connect() {
  let uri = process.env.MONGODB_URI;
  const wantMemory = process.env.USE_MEMORY_DB === 'true';
  // Never fall back to a throw-away in-memory database by accident – that is how "users aren't saved" happens.
  if (!wantMemory && (!uri || /YOUR_DB_USER|YOUR_PASSWORD|YOUR_CLUSTER/.test(uri))) {
    throw new Error('MONGODB_URI is missing (or still the example text). Put your real MongoDB Atlas connection string in the backend .env / Vercel environment variables.');
  }
  if (wantMemory) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri('aura_atelier');
    connect.memory = true;
    console.log('⚠ USE_MEMORY_DB=true → in-memory MongoDB (data is lost on restart)');
  }
  try {
    // If the connection string has no database name (…mongodb.net or …mongodb.net/?opts) MongoDB silently uses "test".
    const hasDb = /^mongodb(\+srv)?:\/\/[^/]+\/[^/?\s]+/.test(uri);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, ...(hasDb ? {} : { dbName: process.env.DB_NAME || 'aura_atelier' }) });
  } catch (e) {
    console.error('\n✗ MongoDB connection failed:', e.message);
    console.error('  Fix checklist:');
    console.error('  1. Atlas → Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0)');
    console.error('  2. Atlas → Database Access → user/password in server/.env must match (special chars must be URL-encoded)');
    console.error('  3. If error says "querySrv ECONNREFUSED": your DNS blocks SRV lookups — switch DNS to 8.8.8.8 or use the non-SRV "standard connection string" from Atlas → Connect → Drivers');
    throw e;
  }
  console.log(`✓ MongoDB connected: ${mongoose.connection.host || 'memory'} → database "${mongoose.connection.name}"`);
}
module.exports = connect;
