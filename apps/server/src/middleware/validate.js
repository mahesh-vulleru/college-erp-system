const { HTTP_STATUS } = require('@college-erp/shared');

/**
 * Recursively trims and sanitizes string inputs to prevent injection and trailing whitespace.
 */
function sanitizeInput(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Middleware generator for schema/field validation and request sanitization.
 * @param {Function} validatorFn - Function receiving req.body (or req) and returning { isValid, errors }
 */
function validateRequest(validatorFn) {
  return (req, res, next) => {
    // Sanitize body before validation
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput(req.body);
    }

    const { isValid, errors } = validatorFn(req.body);
    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Request validation failed',
        errors
      });
    }
    next();
  };
}

module.exports = validateRequest;
