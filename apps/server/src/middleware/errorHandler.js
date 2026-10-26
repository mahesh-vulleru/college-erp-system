const { HTTP_STATUS } = require('@college-erp/shared');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Global Centralized Error Handler
 * Ensures no sensitive stack traces are leaked to clients in production.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Log error securely
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    statusCode,
    path: req.originalUrl,
    ip: req.ip
  });

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      field
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid authorization token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authorization token has expired'
    });
  }

  // Standard client response (sanitize stack traces)
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
