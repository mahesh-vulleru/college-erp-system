const { HTTP_STATUS } = require('@college-erp/shared');

function notFound(req, res, next) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = notFound;
