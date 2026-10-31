function validateTimetableInput(data = {}) {
  const errors = [];
  const { department, course, semester, dayOfWeek, periodNumber, startTime, endTime, subject, faculty } = data;

  if (!department) errors.push('Department is required');
  if (!course) errors.push('Course is required');
  if (!semester) errors.push('Semester is required');
  if (!dayOfWeek) errors.push('Day of week is required');
  if (!periodNumber) errors.push('Period number is required');
  if (!startTime || !endTime) errors.push('Start and end time are required');
  if (!subject) errors.push('Subject is required');
  if (!faculty) errors.push('Faculty is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTimetableInput
};

