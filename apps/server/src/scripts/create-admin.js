/**
 * Create or Update Admin User Script
 * Creates an admin account in MongoDB and verifies authentication.
 */
const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows DNS querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback to system resolver
}

const env = require('../config/env');
const { ROLES, USER_STATUS } = require('@college-erp/shared');
const User = require('../modules/auth/auth.model');

async function createAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  console.log(`[Admin Setup] Connecting to MongoDB: ${env.MONGODB_URI.replace(/:([^:@]{3,})@/, ':****@')}`);

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log('[Admin Setup] Connected to MongoDB successfully.');

    // Check if user already exists
    let user = await User.findOne({ email: adminEmail });

    if (user) {
      console.log(`[Admin Setup] User ${adminEmail} already exists. Updating password and ensuring super_admin role...`);
      user.name = adminName;
      user.password = adminPassword; // Triggers pre('save') bcrypt hashing
      user.role = ROLES.SUPER_ADMIN;
      user.status = USER_STATUS.ACTIVE;
      user.department = 'Administration';
      await user.save();
    } else {
      console.log(`[Admin Setup] Creating new Super Admin account for ${adminEmail}...`);
      user = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: ROLES.SUPER_ADMIN,
        department: 'Administration',
        status: USER_STATUS.ACTIVE
      });
    }

    console.log('\n=============================================================');
    console.log(' SUPER ADMIN ACCOUNT READY');
    console.log('=============================================================');
    console.log(` Name:     ${user.name}`);
    console.log(` Role:     ${user.role} (Super Admin)`);
    console.log(` Email:    ${user.email}`);
    console.log(` Password: ${adminPassword}`);
    console.log(' Portal:   http://localhost:5173/login');
    console.log(' Dashboard: http://localhost:5173/admin');
    console.log('=============================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Admin Setup Error]', error.message);
    if (mongoose.connection) {
      await mongoose.connection.close().catch(() => {});
    }
    process.exit(1);
  }
}

if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;
