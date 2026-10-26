/**
 * Standardized API Response Utilities
 * Enforces uniform JSON response envelope across all College ERP endpoints:
 * Success: { success: true, message: string, data: any, meta?: object }
 * Error:   { success: false, message: string, error?: { code: string, details?: any } }
 */
const { HTTP_STATUS } = require('@college-erp/shared');

/**
 * Send standard success JSON response
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message='Operation completed successfully']
 * @param {any} [options.data=null]
 * @param {Object} [options.meta=null] - Optional pagination, counts, filtering metadata
 */
function sendSuccess(res, { statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = null } = {}) {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta })
  };
  return res.status(statusCode).json(payload);
}

/**
 * Send standard error JSON response
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=500]
 * @param {string} [options.message='Internal Server Error']
 * @param {string} [options.code='INTERNAL_ERROR']
 * @param {any} [options.details=null]
 */
function sendError(res, { statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'Internal Server Error', code = 'INTERNAL_ERROR', details = null } = {}) {
  const payload = {
    success: false,
    message,
    error: {
      code,
      ...(details !== null && { details })
    }
  };
  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendError
};

