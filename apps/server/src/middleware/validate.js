const { HTTP_STATUS } = require('@college-erp/shared');

/**
 * Middleware generator for schema/field validation
 * @param {Function} validatorFn - Function receiving req.body and returning { isValid, errors }
 */
function validateRequest(validatorFn) {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req.body);
    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Request validation failed',
        errors
      });
    }
    next();
  };
}

module.exports = validateRequest;
