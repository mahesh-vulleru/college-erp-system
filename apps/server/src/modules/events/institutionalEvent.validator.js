function validateInstitutionalEventInput(data = {}) {
  const errors = [];
  const { title, description, eventCategory, startDate, endDate, assignedOwner } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Event title is required');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Event description is required');
  }

  const validCategories = [
    'Academic Event',
    'Examination Deadline',
    'Accreditation Submission',
    'Institutional Review',
    'Council Meeting',
    'Administrative Deadline',
    'Fee Due Date',
    'Holiday'
  ];
  if (eventCategory && !validCategories.includes(eventCategory)) {
    errors.push(`Invalid event category. Allowed: ${validCategories.join(', ')}`);
  }

  if (!startDate) {
    errors.push('Start date is required');
  } else if (isNaN(new Date(startDate).getTime())) {
    errors.push('Start date must be a valid timestamp');
  }

  if (!endDate) {
    errors.push('End date is required');
  } else if (isNaN(new Date(endDate).getTime())) {
    errors.push('End date must be a valid timestamp');
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      errors.push('Start date cannot be after end date');
    }
  }

  if (!assignedOwner) {
    errors.push('Assigned owner (User ID) is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateInstitutionalEventInput
};

