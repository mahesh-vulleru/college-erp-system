const express = require('express');
const { login, register, getMe } = require('./auth.controller');
const { validateLoginInput, validateRegisterInput } = require('./auth.validator');
const validateRequest = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', validateRequest(validateLoginInput), login);
router.post('/register', validateRequest(validateRegisterInput), register);

// Protected routes
router.get('/me', authenticate, getMe);

module.exports = router;
