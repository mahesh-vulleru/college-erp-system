function validateTemplateInput(req, res, next) {
  const { code, name, category, bodyTemplate } = req.body;
  const errors = [];

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Template code is required (e.g. TPL-FEE-01)');
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Template name is required');
  }

  const allowedCategories = [
    'fee_reminder',
    'attendance_shortage',
    'examination_alert',
    'result_announcement',
    'general_circular',
    'emergency_alert',
    'placement_drive'
  ];

  if (!category || !allowedCategories.includes(category)) {
    errors.push(`Category must be one of: ${allowedCategories.join(', ')}`);
  }

  if (!bodyTemplate || typeof bodyTemplate !== 'string' || !bodyTemplate.trim()) {
    errors.push('Body template text is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  if (req.body.code) req.body.code = req.body.code.trim().toUpperCase();
  if (req.body.name) req.body.name = req.body.name.trim();

  next();
}

function validateBroadcastInput(req, res, next) {
  const { targetRole, subject, content } = req.body;
  const errors = [];

  if (!targetRole || typeof targetRole !== 'string') {
    errors.push('Target audience role is required');
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    errors.push('Broadcast message content is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

module.exports = {
  validateTemplateInput,
  validateBroadcastInput
};

