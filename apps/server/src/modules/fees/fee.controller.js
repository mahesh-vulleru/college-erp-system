const FeeStructure = require('./fee.model');
const { sendSuccess } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function listFeeStructures(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);
    if (req.query.academicYear) query.academicYear = req.query.academicYear;

    const fees = await FeeStructure.find(query).populate('department', 'name code');

    return sendSuccess(res, {
      message: 'Fee structures retrieved',
      data: fees,
      meta: { count: fees.length }
    });
  } catch (error) {
    next(error);
  }
}

async function createFeeStructure(req, res, next) {
  try {
    const fee = await FeeStructure.create(req.body);
    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Fee structure created successfully',
      data: fee
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFeeStructures,
  createFeeStructure
};

