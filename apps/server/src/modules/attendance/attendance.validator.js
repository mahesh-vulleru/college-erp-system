function validateAttendanceBatchInput(data = {}) {
  const errors = [];
  const { subject, date, records } = data;

  if (!subject) errors.push('Subject ID is required');
  if (!date) errors.push('Date is required');
  if (!Array.isArray(records) || records.length === 0) {
    errors.push('Records must be a non-empty array of student attendance entries');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateAttendanceBatchInput
};

