const os = require('os');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

/**
 * GET /api/v1/system/health-metrics
 * Genuine Node.js process and MongoDB connection pool telemetry
 * Strictly restricted to Super Admin
 */
async function getSystemHealthMetrics(req, res, next) {
  try {
    const memUsage = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    // Measure live database ping latency
    let dbPingMs = null;
    let dbStatus = 'disconnected';
    const state = mongoose.connection.readyState;
    if (state === 1) {
      dbStatus = 'connected';
      try {
        const start = Date.now();
        if (mongoose.connection.db) {
          await mongoose.connection.db.admin().ping();
          dbPingMs = Date.now() - start;
        }
      } catch {
        dbPingMs = -1;
      }
    } else if (state === 2) {
      dbStatus = 'connecting';
    } else if (state === 3) {
      dbStatus = 'disconnecting';
    }

    // Connection pool stats if available from driver topology
    let poolConnections = null;
    try {
      poolConnections =
        mongoose.connection.client?.topology?.s?.pool?.totalConnectionCount ||
        mongoose.connection.client?.topology?.description?.servers?.size ||
        1;
    } catch {
      poolConnections = 1;
    }

    // CPU load & Process metrics
    const cpuUsage = process.cpuUsage();
    const systemMemoryTotalBytes = os.totalmem();
    const systemMemoryFreeBytes = os.freemem();
    const systemMemoryUsedPercent = (
      ((systemMemoryTotalBytes - systemMemoryFreeBytes) / systemMemoryTotalBytes) *
      100
    ).toFixed(2);

    const metrics = {
      timestamp: new Date().toISOString(),
      service: 'college-erp-api',
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.arch()})`,
      uptime: {
        seconds: uptimeSec,
        formatted: `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`
      },
      processMemory: {
        heapUsedMb: Math.round((memUsage.heapUsed / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((memUsage.heapTotal / (1024 * 1024)) * 100) / 100,
        rssMb: Math.round((memUsage.rss / (1024 * 1024)) * 100) / 100,
        externalMb: Math.round((memUsage.external / (1024 * 1024)) * 100) / 100
      },
      osMemory: {
        totalGb: (systemMemoryTotalBytes / (1024 * 1024 * 1024)).toFixed(2),
        freeGb: (systemMemoryFreeBytes / (1024 * 1024 * 1024)).toFixed(2),
        usedPercent: Number(systemMemoryUsedPercent)
      },
      cpu: {
        userMicroseconds: cpuUsage.user,
        systemMicroseconds: cpuUsage.system,
        cores: os.cpus().length,
        loadAverage1m: os.loadavg()[0] || 0
      },
      database: {
        status: dbStatus,
        readyState: state,
        pingLatencyMs: dbPingMs,
        activePoolSize: poolConnections,
        name: mongoose.connection.name || 'college_erp'
      }
    };

    return sendSuccess(res, {
      message: 'Genuine system runtime metrics retrieved',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSystemHealthMetrics
};

