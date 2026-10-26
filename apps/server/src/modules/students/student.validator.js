function validateStudentProfileInput(data = {}) {
  const errors = [];
  const { rollNumber, department, currentSemester, batchYear } = data;

  if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
    errors.push('Roll number is required');
  }
  if (!department) errors.push('Department reference is required');
  if (!currentSemester || typeof currentSemester !== 'number' || currentSemester < 1 || currentSemester > 8) {
    errors.push('Current semester (1-8) is required');
  }
  if (!batchYear || typeof batchYear !== 'string' || !batchYear.trim()) {
    errors.push('Batch year is required (e.g. 2024-2028)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateStudentProfileInput
};

