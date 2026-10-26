const { USER_STATUS } = require('@college-erp/shared');

function validateUserStatusInput(data = {}) {
  const errors = [];
  const { status } = data;

  if (!status || !Object.values(USER_STATUS).includes(status)) {
    errors.push(`Status must be one of: ${Object.values(USER_STATUS).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateUserStatusInput
};

