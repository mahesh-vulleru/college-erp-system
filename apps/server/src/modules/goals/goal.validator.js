function validateGoalInput(data = {}) {
  const errors = [];
  const { title, description, category, targetValue, unit, owner, deadline, startDate } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Goal title is required');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Goal description is required');
  }

  const validCategories = [
    'Academic Excellence',
    'Student Enrollment',
    'Examination & Results',
    'Faculty Development',
    'Placement & Industry',
    'Research & Publications',
    'Infrastructure & Finance',
    'Accreditation & Quality'
  ];
  if (category && !validCategories.includes(category)) {
    errors.push(`Invalid goal category. Allowed: ${validCategories.join(', ')}`);
  }

  if (targetValue === undefined || targetValue === null || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
    errors.push('Target value must be a positive number greater than 0');
  }

  if (!unit || typeof unit !== 'string' || !unit.trim()) {
    errors.push('Measurement unit is required (e.g. %, Students, Papers)');
  }

  if (!owner) {
    errors.push('Assigned goal owner (User ID) is required');
  }

  if (!deadline) {
    errors.push('Goal deadline date is required');
  } else if (isNaN(new Date(deadline).getTime())) {
    errors.push('Goal deadline must be a valid date');
  }

  if (startDate && deadline) {
    const start = new Date(startDate);
    const end = new Date(deadline);
    if (start > end) {
      errors.push('Start date cannot be after deadline date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateProgressRecordInput(data = {}) {
  const errors = [];
  const { value } = data;

  if (value === undefined || value === null || isNaN(Number(value)) || Number(value) < 0) {
    errors.push('Current progress value must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateGoalInput,
  validateProgressRecordInput
};

