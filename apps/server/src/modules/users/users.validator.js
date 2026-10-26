const { ALL_ROLES, USER_STATUS } = require('@college-erp/shared');

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

function validateCreateUserInput(data = {}) {
  const errors = [];
  const { name, email, password, role, status } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full legal name is required');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Valid email address is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim())) {
    errors.push('Please provide a valid institutional email format');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!role || !ALL_ROLES.includes(role)) {
    errors.push(`Role is required and must be one of: ${ALL_ROLES.join(', ')}`);
  }

  if (status && !Object.values(USER_STATUS).includes(status)) {
    errors.push(`Status must be one of: ${Object.values(USER_STATUS).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateUpdateUserInput(data = {}) {
  const errors = [];
  const { name, role, status } = data;

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    errors.push('Name cannot be empty');
  }

  if (role !== undefined && !ALL_ROLES.includes(role)) {
    errors.push(`Role must be one of: ${ALL_ROLES.join(', ')}`);
  }

  if (status !== undefined && !Object.values(USER_STATUS).includes(status)) {
    errors.push(`Status must be one of: ${Object.values(USER_STATUS).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateResetPasswordInput(data = {}) {
  const errors = [];
  const { newPassword } = data;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('New password is required and must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateUserStatusInput,
  validateCreateUserInput,
  validateUpdateUserInput,
  validateResetPasswordInput
};
