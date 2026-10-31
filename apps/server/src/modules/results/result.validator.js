function validateResultInput(data = {}) {
  const errors = [];
  const { examination, student, subject, internalMarks, externalMarks } = data;

  if (!examination) errors.push('Examination ID is required');
  if (!student) errors.push('Student ID is required');
  if (!subject) errors.push('Subject ID is required');
  if (internalMarks !== undefined && (internalMarks < 0 || internalMarks > 40)) {
    errors.push('Internal marks must be between 0 and 40');
  }
  if (externalMarks !== undefined && (externalMarks < 0 || externalMarks > 60)) {
    errors.push('External marks must be between 0 and 60');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateResultInput
};

