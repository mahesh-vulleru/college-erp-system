const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, register, getMe, changePassword } = require('./auth.controller');
const { validateLoginInput, validateRegisterInput } = require('./auth.validator');
const validateRequest = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');

const router = express.Router();

// Dedicated rate limiter for login attempts to thwart credential stuffing & brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

// Public authentication routes
router.post('/login', loginLimiter, validateRequest(validateLoginInput), login);
router.post('/register', validateRequest(validateRegisterInput), register);

// Protected session & password management routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
