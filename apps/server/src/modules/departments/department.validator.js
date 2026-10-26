function validateDepartmentInput(data = {}) {
  const errors = [];
  const { name, code } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Department name is required');
  }

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Department code is required');
  } else if (code.trim().length > 10) {
    errors.push('Department code cannot exceed 10 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateDepartmentInput
};

