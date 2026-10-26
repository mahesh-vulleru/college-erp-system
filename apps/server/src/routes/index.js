const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('../modules/auth/auth.routes');

const router = express.Router();

// Mount standard routes
router.use('/health', healthRoutes);
router.use('/v1/auth', authRoutes);

module.exports = router;
