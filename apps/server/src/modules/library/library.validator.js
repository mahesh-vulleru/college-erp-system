/**
 * Input validators for library endpoints
 */

function validateBookInput(body = {}) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('Book title is required');
  if (!body.author || !body.author.trim()) errors.push('Author name is required');
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCategoryInput(body = {}) {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push('Category name is required');
  if (!body.code || !body.code.trim()) errors.push('Category code is required');
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateMemberInput(body = {}) {
  const errors = [];
  if (!body.userId && !body.user && !body.name) {
    errors.push('Member identification or name is required');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateIssueInput(body = {}) {
  const errors = [];
  if (!body.memberId && !body.membershipNumber && !body.membershipCardNumber) {
    errors.push('Member identification is required');
  }
  if (!body.copyId && !body.accessionNumber) {
    errors.push('Book copy or accession number is required');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateReturnInput(body = {}) {
  const errors = [];
  if (!body.issueId && !body.accessionNumber) {
    errors.push('Issue ID or book accession number is required');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateFineWaiveInput(body = {}) {
  const errors = [];
  const reason = body.reason || body.waiveReason;
  if (!reason || !reason.trim()) {
    errors.push('Waiver reason is required and must be justified');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDigitalResourceInput(body = {}) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('Resource title is required');
  if (!body.author || !body.author.trim()) errors.push('Author/Contributor is required');
  if (!body.fileUrl || !body.fileUrl.trim()) errors.push('Resource file URL or download link is required');
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateBookInput,
  validateCategoryInput,
  validateMemberInput,
  validateIssueInput,
  validateReturnInput,
  validateFineWaiveInput,
  validateDigitalResourceInput
};
