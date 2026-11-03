/**
 * Idempotent Development Account Seeding
 * Safely ensures required development accounts exist without wiping database data.
 * SAFETY: Only operates in non-production environments.
 */
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore DNS config failure if restricted
}

const mongoose = require('mongoose');
const env = require('../config/env');
const { ROLES, USER_STATUS } = require('@college-erp/shared');
const User = require('../modules/auth/auth.model');
const logger = require('../utils/logger');

const DEV_ACCOUNTS = [
  {
    name: 'Mr. Robert Hayes',
    email: 'transport@college.edu',
    password: process.env.SEED_TRANSPORT_PASSWORD || 'Password123!',
    role: ROLES.TRANSPORT_ADMIN,
    department: 'Transport & Logistics',
    status: USER_STATUS.ACTIVE
  },
  {
    name: 'Ms. Sarah Jenkins',
    email: 'supervisor@college.edu',
    password: 'Password123!',
    role: ROLES.TRANSPORT_SUPERVISOR,
    department: 'Transport Operations',
    status: USER_STATUS.ACTIVE
  },
  {
    name: 'Mr. Rajesh Kumar',
    email: 'driver@college.edu',
    password: 'Password123!',
    role: ROLES.BUS_DRIVER,
    department: 'Transport Fleet',
    status: USER_STATUS.ACTIVE
  },
  {
    name: 'Mrs. Sunita Sharma',
    email: 'attendant@college.edu',
    password: 'Password123!',
    role: ROLES.BUS_ATTENDANT,
    department: 'Student Transit Care',
    status: USER_STATUS.ACTIVE
  },
  {
    name: 'Mr. Vikram Sharma',
    email: 'parent@college.edu',
    password: 'Password123!',
    role: ROLES.PARENT,
    department: 'Parents Association',
    status: USER_STATUS.ACTIVE
  }
];

/**
 * Idempotently creates missing development accounts.
 * Never overwrites existing user passwords or modifies production accounts.
 */
async function ensureDevAccounts() {
  if (env.NODE_ENV === 'production') {
    return;
  }

  try {
    for (const acc of DEV_ACCOUNTS) {
      const cleanEmail = acc.email.toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail });
      if (!existing) {
        await User.create({
          name: acc.name,
          email: cleanEmail,
          password: acc.password,
          role: acc.role,
          department: acc.department,
          status: acc.status
        });
        logger.info(`[DevSeed] Created missing development test account: ${cleanEmail} (${acc.role})`);
      } else if (existing.role !== acc.role || existing.status !== USER_STATUS.ACTIVE) {
        existing.role = acc.role;
        existing.status = USER_STATUS.ACTIVE;
        await existing.save();
        logger.info(`[DevSeed] Re-aligned existing test account role/status: ${cleanEmail} (${acc.role})`);
      }
    }
  } catch (error) {
    logger.warn('[DevSeed] Non-fatal notice during development seed check:', error.message);
  }
}

// Standalone execution support
if (require.main === module) {
  (async () => {
    try {
      console.log(`[DevSeed CLI] Connecting to MongoDB: ${env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      console.log('[DevSeed CLI] Connected successfully.');
      await ensureDevAccounts();
      for (const acc of DEV_ACCOUNTS) {
        const u = await User.findOne({ email: acc.email });
        if (u) {
          console.log(`[DevSeed CLI] Account verified: ${u.email} -> ${u.role}`);
        }
      }
      await mongoose.disconnect();
      console.log('[DevSeed CLI] Complete.');
      process.exit(0);
    } catch (err) {
      console.error('[DevSeed CLI] Failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  ensureDevAccounts,
  DEV_ACCOUNTS
};
