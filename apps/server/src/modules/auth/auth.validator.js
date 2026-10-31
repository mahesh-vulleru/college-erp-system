const { ALL_ROLES } = require('@college-erp/shared');

function validateLoginInput(data = {}) {
  const errors = [];
  const { email, password, role } = data;

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email address is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim())) {
    errors.push('Please enter a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  const allowedLoginRoles = [...ALL_ROLES, 'admin', 'superadmin', 'super_administrator'];
  if (role && !allowedLoginRoles.includes(String(role).toLowerCase().trim().replace(/[\s-]+/g, '_'))) {
    errors.push(`Role must be one of: ${ALL_ROLES.join(', ')}`);
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

  const allowedLoginRoles = [...ALL_ROLES, 'admin', 'superadmin', 'super_administrator'];
  if (role && !allowedLoginRoles.includes(String(role).toLowerCase().trim().replace(/[\s-]+/g, '_'))) {
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
