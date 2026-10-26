const mongoose = require('mongoose');
const AuditLog = require('../modules/audit-logs/audit.model');

/**
 * Record an administrative security audit log entry in MongoDB
 */
async function recordAuditLog({ user, action, entityType, entityId, details, req }) {
  try {
    // Only attempt write if MongoDB connection is open (avoids buffering timeouts during tests/offline)
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const ipAddress = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers ? req.headers['user-agent'] || 'Unknown' : 'Unknown';

    await AuditLog.create({
      user: user || req?.user?._id || null,
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      details: details || {},
      ipAddress,
      userAgent
    });
  } catch (err) {
    // Non-blocking log failure
    console.error('[AuditLog Error]', err.message);
  }
}

module.exports = {
  recordAuditLog
};
