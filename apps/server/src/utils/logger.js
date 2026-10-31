/**
 * Centralized, safe logger utility
 * Masks sensitive keys (passwords, tokens, secrets) from console output.
 */

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'jwt', 'cookie', 'cvv'];

function maskSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData);
  }

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? maskSensitiveData(meta) : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? maskSensitiveData(meta) : '');
  },
  error: (message, error = {}) => {
    const errorDetails = error instanceof Error
      ? { message: error.message, name: error.name }
      : maskSensitiveData(error);
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, errorDetails);
  }
};

module.exports = logger;
