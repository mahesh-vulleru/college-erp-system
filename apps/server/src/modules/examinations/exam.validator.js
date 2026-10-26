function validateExamInput(data = {}) {
  const errors = [];
  const { name, examType, academicYear, semester, startDate, endDate } = data;

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Exam name is required');
  if (!examType) errors.push('Exam type is required');
  if (!academicYear) errors.push('Academic year is required');
  if (!semester || typeof semester !== 'number') errors.push('Semester is required');
  if (!startDate || !endDate) errors.push('Start and end dates are required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateExamInput
};

