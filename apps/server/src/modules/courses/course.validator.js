function validateCourseInput(data = {}) {
  const errors = [];
  const { name, code, department } = data;

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Course name is required');
  if (!code || typeof code !== 'string' || !code.trim()) errors.push('Course code is required');
  if (!department) errors.push('Department ID is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateCourseInput
};

