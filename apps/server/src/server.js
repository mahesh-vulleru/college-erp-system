const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

async function startServer() {
  try {
    // Attempt DB connection
    try {
      await connectDB();
    } catch (dbErr) {
      logger.warn('Server started without active MongoDB connection. Waiting for reconnect...');
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`===================================================`);
      logger.info(` College ERP Backend Service`);
      logger.info(` Environment: ${env.NODE_ENV}`);
      logger.info(` Port:        ${env.PORT}`);
      logger.info(` Health API:  http://localhost:${env.PORT}/api/health`);
      logger.info(`===================================================`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', reason);
      server.close(() => process.exit(1));
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received: closing HTTP server and database...`);
      server.close(async () => {
        const { closeDB } = require('./config/db');
        await closeDB();
        logger.info('Server gracefully terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
