function validateFeeStructureInput(data = {}) {
  const errors = [];
  const { title, department, academicYear, semester, tuitionFee, dueDate } = data;

  if (!title || typeof title !== 'string' || !title.trim()) errors.push('Title is required');
  if (!department) errors.push('Department reference is required');
  if (!academicYear) errors.push('Academic year is required');
  if (!semester) errors.push('Semester is required');
  if (tuitionFee === undefined || tuitionFee < 0) errors.push('Valid tuition fee is required');
  if (!dueDate) errors.push('Due date is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFeeStructureInput
};

