const { ALL_ROLES } = require('@college-erp/shared');

function validateLoginInput(data = {}) {
  const errors = [];
  const { email, password } = data;
  const role = data.role !== undefined ? data.role : data.institutionalRole;

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Valid email address is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim())) {
    errors.push('Please provide a valid email format');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  const allowedLoginRoles = [
    ...ALL_ROLES,
    'admin',
    'superadmin',
    'super_administrator',
    'chief_librarian',
    'chief librarian',
    'library_staff',
    'library staff',
    'librarystaff',
    'accountant',
    'finance'
  ];
  if (role) {
    const normalizedRole = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
    const isAllowed = allowedLoginRoles.some((r) => {
      const normAllowed = String(r).toLowerCase().trim().replace(/[\s-]+/g, '_');
      return normAllowed === normalizedRole;
    });
    if (!isAllowed) {
      errors.push(`Role must be one of: ${ALL_ROLES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateRegisterInput(data = {}) {
  const errors = [];
  const { name, email, password } = data;
  const role = data.role !== undefined ? data.role : data.institutionalRole;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required');
  }

  const loginCheck = validateLoginInput({ email, password });
  errors.push(...loginCheck.errors);

  const allowedLoginRoles = [
    ...ALL_ROLES,
    'admin',
    'superadmin',
    'super_administrator',
    'chief_librarian',
    'chief librarian',
    'library_staff',
    'library staff',
    'librarystaff',
    'accountant',
    'finance'
  ];
  if (role) {
    const normalizedRole = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
    const isAllowed = allowedLoginRoles.some((r) => {
      const normAllowed = String(r).toLowerCase().trim().replace(/[\s-]+/g, '_');
      return normAllowed === normalizedRole;
    });
    if (!isAllowed) {
      errors.push(`Role must be one of: ${ALL_ROLES.join(', ')}`);
    }
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
