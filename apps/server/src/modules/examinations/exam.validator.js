function validateExamInput(data = {}) {
  const errors = [];
  const { name, examType, academicYear, semester, startDate, endDate } = data;

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Exam name is required');
  if (!examType) errors.push('Exam type is required');
  if (!academicYear) errors.push('Academic year is required');
  if (semester === undefined || semester === null || isNaN(Number(semester))) {
    errors.push('Semester is required');
  }
  if (!startDate || !endDate) {
    errors.push('Start and end dates are required');
  } else if (new Date(startDate) > new Date(endDate)) {
    errors.push('Exam start date cannot be later than end date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateExamInput
};
