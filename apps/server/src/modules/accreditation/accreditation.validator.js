function validateAccreditationCriterionInput(data = {}) {
  const errors = [];
  const { code, title, description, framework, category, assignedOwner, dueDate, weightage } = data;

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Criterion code is required (e.g. NAAC-C1.1, NBA-C2.1)');
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Criterion title is required');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Criterion description is required');
  }

  const validFrameworks = ['NAAC', 'NBA', 'NIRF', 'ISO', 'UGC', 'AICTE'];
  if (framework && !validFrameworks.includes(framework)) {
    errors.push(`Invalid framework. Allowed: ${validFrameworks.join(', ')}`);
  }

  const validCategories = [
    'Curricular Aspects',
    'Teaching-Learning & Evaluation',
    'Research, Innovations & Extension',
    'Infrastructure & Learning Resources',
    'Student Support & Progression',
    'Governance, Leadership & Management',
    'Institutional Values & Best Practices',
    'Program Outcomes & Course Outcomes',
    'Facilities & Technical Support',
    'Continuous Improvement'
  ];
  if (category && !validCategories.includes(category)) {
    errors.push(`Invalid accreditation category. Must match standard accreditation criteria.`);
  }

  if (!assignedOwner) {
    errors.push('Assigned owner (User ID) is required');
  }

  if (!dueDate) {
    errors.push('Due date is required');
  } else if (isNaN(new Date(dueDate).getTime())) {
    errors.push('Due date must be a valid timestamp');
  }

  if (weightage !== undefined && (isNaN(Number(weightage)) || Number(weightage) < 0)) {
    errors.push('Weightage must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateEvidenceVerificationInput(data = {}) {
  const errors = [];
  const { verificationStatus } = data;

  if (!verificationStatus || !['verified', 'rejected', 'pending'].includes(verificationStatus)) {
    errors.push("Verification status must be 'verified', 'rejected', or 'pending'");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateAccreditationCriterionInput,
  validateEvidenceVerificationInput
};

