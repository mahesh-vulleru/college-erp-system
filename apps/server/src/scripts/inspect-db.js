const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../modules/auth/auth.model');
const bcrypt = require('bcryptjs');

async function inspectDB() {
  console.log('Connecting to:', env.MONGODB_URI.replace(/:([^:@]{3,})@/, ':****@'));
  const conn = await mongoose.connect(env.MONGODB_URI);
  console.log('Connected DB Name:', conn.connection.name);
  console.log('Connected Host:', conn.connection.host);

  const collections = await conn.connection.db.listCollections().toArray();
  console.log('Collections in database:', collections.map(c => c.name));

  const allUsers = await User.find({}).select('+password');
  console.log('Total users in', conn.connection.name, ':', allUsers.length);
  for (const u of allUsers) {
    const isTestPass = await u.comparePassword('Admin@12345');
    const isCommonPass = await u.comparePassword('Password123!');
    console.log({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      hasPassword: !!u.password,
      passwordHashLength: u.password ? u.password.length : 0,
      matchesAdminPass: isTestPass,
      matchesCommonPass: isCommonPass
    });
  }

  // Also check other databases in cluster
  const admin = conn.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('\nAll databases in cluster:', dbs.databases.map(d => d.name));

  for (const dbInfo of dbs.databases) {
    if (dbInfo.name === 'admin' || dbInfo.name === 'local') continue;
    const dbInstance = conn.connection.client.db(dbInfo.name);
    const userCount = await dbInstance.collection('users').countDocuments().catch(() => 0);
    console.log(`Database '${dbInfo.name}' users count: ${userCount}`);
    if (userCount > 0) {
      const dbUsers = await dbInstance.collection('users').find({}).toArray();
      for (const du of dbUsers) {
        const matchesAdmin = du.password ? await bcrypt.compare('Admin@12345', du.password) : false;
        const matchesCommon = du.password ? await bcrypt.compare('Password123!', du.password) : false;
        console.log(`  -> [${dbInfo.name}] ${du.email} (${du.role}) status=${du.status} matchesAdmin=${matchesAdmin} matchesCommon=${matchesCommon}`);
      }
    }
  }

  await mongoose.disconnect();
}

inspectDB().catch(console.error);