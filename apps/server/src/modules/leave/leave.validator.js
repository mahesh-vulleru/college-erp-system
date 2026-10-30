function validateLeaveApplyInput(data = {}) {
  const errors = [];
  const { startDate, endDate, reason, leaveType } = data;

  if (!startDate) {
    errors.push('Start date is required');
  } else if (isNaN(new Date(startDate).getTime())) {
    errors.push('Start date must be a valid date');
  }

  if (!endDate) {
    errors.push('End date is required');
  } else if (isNaN(new Date(endDate).getTime())) {
    errors.push('End date must be a valid date');
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      errors.push('Start date cannot be after end date');
    }
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.push('Reason for leave is required');
  }

  const validLeaveTypes = [
    'casual',
    'sick',
    'earned',
    'maternity',
    'paternity',
    'duty',
    'special_casual',
    'unpaid',
    'other'
  ];
  if (leaveType && !validLeaveTypes.includes(leaveType)) {
    errors.push(`Invalid leave type. Must be one of: ${validLeaveTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateLeaveReviewInput(data = {}) {
  const errors = [];
  const { status, rejectionReason } = data;

  if (!status || !['approved', 'rejected'].includes(status)) {
    errors.push("Decision status must be either 'approved' or 'rejected'");
  }

  if (status === 'rejected') {
    if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
      errors.push('Rejection reason is mandatory when rejecting a leave request');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateLeaveApplyInput,
  validateLeaveReviewInput
};

