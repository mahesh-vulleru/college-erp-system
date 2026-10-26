const { ALL_ROLES } = require('@college-erp/shared');

function validateLoginInput(data = {}) {
  const errors = [];
  const { email, password } = data;

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Valid email address is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim())) {
    errors.push('Please provide a valid email format');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateRegisterInput(data = {}) {
  const errors = [];
  const { name, email, password, role } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required');
  }

  const loginCheck = validateLoginInput({ email, password });
  errors.push(...loginCheck.errors);

  if (role && !ALL_ROLES.includes(role)) {
    errors.push(`Role must be one of: ${ALL_ROLES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateLoginInput,
  validateRegisterInput
};
