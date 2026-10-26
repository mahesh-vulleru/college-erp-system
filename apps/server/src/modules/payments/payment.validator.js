function validatePaymentInput(data = {}) {
  const errors = [];
  const { student, feeStructure, amountPaid, receiptNumber } = data;

  if (!student) errors.push('Student ID is required');
  if (!feeStructure) errors.push('Fee Structure ID is required');
  if (!amountPaid || amountPaid <= 0) errors.push('Valid amount paid is required');
  if (!receiptNumber) errors.push('Receipt number is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validatePaymentInput
};

