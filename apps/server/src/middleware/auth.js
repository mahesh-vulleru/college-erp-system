const jwt = require('jsonwebtoken');
const { HTTP_STATUS, USER_STATUS } = require('@college-erp/shared');
const env = require('../../config/env');
const User = require('../modules/auth/auth.model');

/**
 * Authentication Middleware:
 * Validates JWT Bearer token from Authorization header.
 * Attaches sanitized user object to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. Bearer token missing from Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. Malformed authorization token.'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Account is ${user.status}. Please contact administrator.`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
}

module.exports = authenticate;
