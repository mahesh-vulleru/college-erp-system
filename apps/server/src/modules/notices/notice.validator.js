function validateNoticeInput(data = {}) {
  const errors = [];
  const { title, content } = data;

  if (!title || typeof title !== 'string' || !title.trim()) errors.push('Notice title is required');
  if (!content || typeof content !== 'string' || !content.trim()) errors.push('Notice content is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateNoticeInput
};

