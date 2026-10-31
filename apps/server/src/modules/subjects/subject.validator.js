function validateSubjectInput(data = {}) {
  const errors = [];
  const { name, code, course, semester } = data;

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Subject name is required');
  if (!code || typeof code !== 'string' || !code.trim()) errors.push('Subject code is required');
  if (!course) errors.push('Course reference is required');
  if (!semester || typeof semester !== 'number' || semester < 1 || semester > 8) {
    errors.push('Valid semester between 1 and 8 is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateSubjectInput
};

