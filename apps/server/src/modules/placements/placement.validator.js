function validateDriveInput(req, res, next) {
  const { driveCode, company, jobTitle, ctc, driveDate, registrationDeadline } = req.body;
  const errors = [];

  if (!driveCode || typeof driveCode !== 'string' || !driveCode.trim()) {
    errors.push('Drive code is required');
  }

  if (!company) {
    errors.push('Recruiting company ID is required');
  }

  if (!jobTitle || typeof jobTitle !== 'string' || !jobTitle.trim()) {
    errors.push('Job title is required');
  }

  if (!ctc || ctc.annualSalaryLpa === undefined || isNaN(Number(ctc.annualSalaryLpa)) || Number(ctc.annualSalaryLpa) < 0) {
    errors.push('Valid annual salary package (CTC in LPA) is required');
  }

  if (!driveDate) {
    errors.push('Drive date is required');
  }

  if (!registrationDeadline) {
    errors.push('Registration deadline is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  if (req.body.driveCode) req.body.driveCode = req.body.driveCode.trim().toUpperCase();
  if (req.body.jobTitle) req.body.jobTitle = req.body.jobTitle.trim();

  next();
}

function validateCompanyInput(req, res, next) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Company name is required'
    });
  }
  req.body.name = req.body.name.trim();
  next();
}

module.exports = {
  validateDriveInput,
  validateCompanyInput
};

