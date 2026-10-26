const express = require('express');
const { getDatabaseStatus } = require('../config/db');
const env = require('../config/env');
const { HTTP_STATUS } = require('@college-erp/shared');

const router = express.Router();

/**
 * GET /api/health
 * Production-ready health check endpoint
 */
router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const uptimeSeconds = Math.floor(process.uptime());

  const responsePayload = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    environment: env.NODE_ENV,
    database: dbStatus,
    service: 'college-erp-api',
    version: '1.0.0'
  };

  res.status(HTTP_STATUS.OK).json(responsePayload);
});

module.exports = router;
