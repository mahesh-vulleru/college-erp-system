function validateAssetInput(req, res, next) {
  const { name, assetCode, category, purchaseCost } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Asset name is required');
  }

  if (!assetCode || typeof assetCode !== 'string' || !assetCode.trim()) {
    errors.push('Asset code is required');
  }

  const allowedCategories = [
    'it_equipment',
    'lab_equipment',
    'furniture',
    'audio_visual',
    'classroom_hardware',
    'sports',
    'other'
  ];
  if (category && !allowedCategories.includes(category)) {
    errors.push(`Category must be one of: ${allowedCategories.join(', ')}`);
  }

  if (purchaseCost === undefined || purchaseCost === null || isNaN(Number(purchaseCost)) || Number(purchaseCost) < 0) {
    errors.push('Purchase cost must be a non-negative number');
  }

  if (req.body.depreciationRate !== undefined) {
    const rate = Number(req.body.depreciationRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      errors.push('Depreciation rate must be a percentage between 0 and 100');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Clean strings
  if (req.body.name) req.body.name = req.body.name.trim();
  if (req.body.assetCode) req.body.assetCode = req.body.assetCode.trim().toUpperCase();
  if (req.body.purchaseCost !== undefined) req.body.purchaseCost = Number(req.body.purchaseCost);

  next();
}

module.exports = {
  validateAssetInput
};

