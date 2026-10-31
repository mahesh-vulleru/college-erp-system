function validatePaymentInput(data = {}) {
  const errors = [];
  const { student, feeStructure, invoice, amountPaid } = data;

  if (!student) errors.push('Student ID is required');
  if (!feeStructure && !invoice) errors.push('Either Fee Structure or Invoice ID is required');
  if (!amountPaid || Number(amountPaid) <= 0) errors.push('Valid positive amount paid is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validatePaymentInput
};
