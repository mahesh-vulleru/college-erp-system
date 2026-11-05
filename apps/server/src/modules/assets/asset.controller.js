const Asset = require('./asset.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

/**
 * GET /api/v1/assets
 * List campus inventory assets with filters and search
 */
async function listAssets(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.status) query.status = req.query.status;
    if (req.query.department) query.department = req.query.department;

    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ name: regex }, { assetCode: regex }, { serialNumber: regex }, { subCategory: regex }];
    }

    const [assets, total] = await Promise.all([
      Asset.find(query)
        .populate('department', 'name code')
        .populate('assignedTo', 'name email role')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Asset.countDocuments(query)
    ]);

    // Attach dynamic computed depreciation
    const data = assets.map((a) => {
      const obj = a.toObject();
      obj.depreciatedValue = a.calculateDepreciatedValue();
      return obj;
    });

    return sendSuccess(res, {
      message: 'Campus asset inventory retrieved',
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/assets/:id
 */
async function getAssetById(req, res, next) {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('department', 'name code')
      .populate('assignedTo', 'name email role');

    if (!asset) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Asset not found',
        code: 'NOT_FOUND'
      });
    }

    const resObj = asset.toObject();
    resObj.depreciatedValue = asset.calculateDepreciatedValue();

    return sendSuccess(res, { data: resObj });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/assets
 */
async function createAsset(req, res, next) {
  try {
    const { assetCode } = req.body;
    const cleanCode = String(assetCode).trim().toUpperCase();

    const existing = await Asset.findOne({ assetCode: cleanCode });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `An asset with code '${cleanCode}' already exists in the inventory`,
        code: 'DUPLICATE_ASSET_CODE'
      });
    }

    const asset = await Asset.create({
      ...req.body,
      assetCode: cleanCode
    });

    await recordAuditLog({
      req,
      action: 'ASSET_PROVISIONED',
      entityType: 'Asset',
      entityId: asset._id,
      details: { assetCode: asset.assetCode, name: asset.name, category: asset.category, cost: asset.purchaseCost }
    });

    const resObj = asset.toObject();
    resObj.depreciatedValue = asset.calculateDepreciatedValue();

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Asset registered in campus inventory successfully',
      data: resObj
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/assets/:id
 */
async function updateAsset(req, res, next) {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Asset not found',
        code: 'NOT_FOUND'
      });
    }

    if (req.body.assetCode && req.body.assetCode.toUpperCase() !== asset.assetCode) {
      const existing = await Asset.findOne({ assetCode: req.body.assetCode.toUpperCase(), _id: { $ne: asset._id } });
      if (existing) {
        return sendError(res, {
          statusCode: HTTP_STATUS.CONFLICT,
          message: `Asset code '${req.body.assetCode.toUpperCase()}' is already used by another asset`,
          code: 'DUPLICATE_ASSET_CODE'
        });
      }
      asset.assetCode = req.body.assetCode.toUpperCase();
    }

    const fields = [
      'name',
      'category',
      'subCategory',
      'department',
      'location',
      'purchaseCost',
      'currentValue',
      'depreciationRate',
      'usefulLifeYears',
      'vendor',
      'status',
      'assignedTo',
      'serialNumber',
      'remarks'
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        asset[f] = req.body[f];
      }
    });

    await asset.save();

    await recordAuditLog({
      req,
      action: 'ASSET_UPDATED',
      entityType: 'Asset',
      entityId: asset._id,
      details: { assetCode: asset.assetCode, status: asset.status }
    });

    const resObj = asset.toObject();
    resObj.depreciatedValue = asset.calculateDepreciatedValue();

    return sendSuccess(res, {
      message: 'Asset details updated successfully',
      data: resObj
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/assets/:id
 */
async function deleteAsset(req, res, next) {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Asset not found',
        code: 'NOT_FOUND'
      });
    }

    await recordAuditLog({
      req,
      action: 'ASSET_DELETED',
      entityType: 'Asset',
      entityId: req.params.id,
      details: { assetCode: asset.assetCode, name: asset.name }
    });

    return sendSuccess(res, {
      message: 'Asset decommissioned and removed from active inventory',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/assets/:id/maintenance
 * Log maintenance activity on asset
 */
async function addMaintenanceRecord(req, res, next) {
  try {
    const { description, cost, technician, nextServiceDue, status } = req.body;
    if (!description || !description.trim()) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Maintenance description is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Asset not found',
        code: 'NOT_FOUND'
      });
    }

    const record = {
      maintenanceId: `MNT-${Date.now().toString(36).toUpperCase()}`,
      description: description.trim(),
      cost: Number(cost) || 0,
      technician: technician ? technician.trim() : 'Campus Engineering Team',
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : undefined,
      status: status || 'completed',
      date: new Date()
    };

    asset.maintenanceSchedule.push(record);
    await asset.save();

    await recordAuditLog({
      req,
      action: 'ASSET_MAINTENANCE_LOGGED',
      entityType: 'Asset',
      entityId: asset._id,
      details: { maintenanceId: record.maintenanceId, cost: record.cost }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Maintenance activity logged successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  addMaintenanceRecord
};

