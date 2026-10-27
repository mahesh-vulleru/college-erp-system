const mongoose = require('mongoose');
const AuditLog = require('../modules/audit-logs/audit.model');

const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'jwt',
  'cookie',
  'cvv',
  'cardnumber',
  'razorpay_signature',
  'key_secret'
];

function sanitizeAuditDetails(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeAuditDetails);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditDetails(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Record an administrative security audit log entry in MongoDB
 */
async function recordAuditLog({
  user,
  action,
  entityType,
  entityId,
  details = {},
  outcome = 'success',
  requestId = null,
  req = null
}) {
  try {
    // Only attempt write if MongoDB connection is open (avoids buffering timeouts during tests/offline)
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const ipAddress = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers ? req.headers['user-agent'] || 'Unknown' : 'Unknown';
    const resolvedReqId = requestId || req?.headers?.['x-request-id'] || null;
    const actorUser = user || req?.user?._id || null;

    const safeDetails = sanitizeAuditDetails(details);

    await AuditLog.create({
      user: actorUser,
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      outcome,
      requestId: resolvedReqId,
      details: safeDetails || {},
      ipAddress,
      userAgent
    });
  } catch (err) {
    // Non-blocking log failure
    console.error('[AuditLog Error]', err.message);
  }
}

module.exports = {
  recordAuditLog,
  sanitizeAuditDetails
};
