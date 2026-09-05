const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (uri && uri.trim() !== '') {
      console.log(`[DB] Attempting connection to MongoDB at: ${uri.split('@').pop()}`);
      await mongoose.connect(uri);
      console.log(`[DB] Successfully connected to MongoDB`);
      return;
    }

    // If no URI is provided, use MongoDB Memory Server for seamless local dev/evaluation
    console.log('[DB] No MONGODB_URI provided. Initializing in-memory MongoDB server for local development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'connectbill'
      }
    });
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[DB] Successfully connected to In-Memory MongoDB at ${memoryUri}`);
  } catch (error) {
    console.warn(`[DB] Primary connection failed: ${error.message}`);
    // If it failed and we hadn't tried memory server yet, attempt memory server fallback
    if (!mongoMemoryServer) {
      try {
        console.log('[DB] Falling back to In-Memory MongoDB server...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const fallbackUri = mongoMemoryServer.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`[DB] Successfully connected to Fallback In-Memory MongoDB`);
        return;
      } catch (fallbackError) {
        console.error(`[DB] Fallback In-Memory MongoDB failed: ${fallbackError.message}`);
      }
    }
    console.error(`[DB] Could not establish MongoDB connection. Exiting...`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('[DB] Disconnect error:', err);
  }
};

module.exports = { connectDB, disconnectDB };
