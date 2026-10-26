const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.NODE_ENV !== 'production'
    });

    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} (${conn.connection.host})`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Runtime error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Reconnect may be attempted...');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection error: ${error.message}`);
    // Do not crash test suites when testing without a live DB
    if (env.NODE_ENV !== 'test') {
      console.error('[MongoDB] Check that your MongoDB server is running and MONGODB_URI is valid.');
    }
    throw error;
  }
}

async function closeDB() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[MongoDB] Connection closed safely.');
  }
}

function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const stateCode = mongoose.connection.readyState;
  return {
    status: states[stateCode] || 'unknown',
    readyState: stateCode,
    databaseName: mongoose.connection.name || null
  };
}

module.exports = {
  connectDB,
  closeDB,
  getDatabaseStatus
};
