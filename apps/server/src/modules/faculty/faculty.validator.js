function validateFacultyInput(data = {}) {
  const errors = [];
  const { employeeId, department, designation } = data;

  if (!employeeId || typeof employeeId !== 'string' || !employeeId.trim()) {
    errors.push('Employee ID is required');
  }
  if (!department) errors.push('Department reference is required');
  if (!designation) errors.push('Designation is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFacultyInput
};

