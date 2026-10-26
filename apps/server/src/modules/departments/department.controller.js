const Department = require('./department.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function listDepartments(req, res, next) {
  try {
    const departments = await Department.find().populate('hod', 'name email');
    return sendSuccess(res, {
      message: 'Departments fetched successfully',
      data: departments,
      meta: { count: departments.length }
    });
  } catch (error) {
    next(error);
  }
}

async function getDepartmentById(req, res, next) {
  try {
    const dept = await Department.findById(req.params.id).populate('hod', 'name email');
    if (!dept) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Department not found',
        code: 'NOT_FOUND'
      });
    }
    return sendSuccess(res, { data: dept });
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code, hod, intakeCapacity, description } = req.body;
    const existing = await Department.findOne({ $or: [{ code }, { name }] });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Department with this code or name already exists',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const dept = await Department.create({ name, code, hod, intakeCapacity, description });
    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Department created successfully',
      data: dept
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDepartments,
  getDepartmentById,
  createDepartment
};

