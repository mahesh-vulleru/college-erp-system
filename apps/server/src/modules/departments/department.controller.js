const Department = require('./department.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

async function listDepartments(req, res, next) {
  try {
    const departments = await Department.find().populate('hod', 'name email role department');
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
    const dept = await Department.findById(req.params.id).populate('hod', 'name email role department');
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

    if (hod) {
      const existingHod = await Department.findOne({ hod });
      if (existingHod) {
        return sendError(res, {
          statusCode: HTTP_STATUS.CONFLICT,
          message: `This HOD is already assigned to the '${existingHod.name}' department.`,
          code: 'HOD_ASSIGNMENT_CONFLICT'
        });
      }
    }

    const dept = await Department.create({ name, code, hod, intakeCapacity, description });

    await recordAuditLog({
      req,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: dept._id,
      details: { code: dept.code, name: dept.name }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Department created successfully',
      data: dept
    });
  } catch (error) {
    next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const { name, code, hod, intakeCapacity, description, isActive } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Department not found',
        code: 'NOT_FOUND'
      });
    }

    if (hod) {
      // Check for conflict: ensure HOD is not assigned to another department
      const existingHodDept = await Department.findOne({ hod, _id: { $ne: req.params.id } });
      if (existingHodDept) {
        return sendError(res, {
          statusCode: HTTP_STATUS.CONFLICT,
          message: `This HOD is already assigned to the '${existingHodDept.name}' department. Reassign them first.`,
          code: 'HOD_ASSIGNMENT_CONFLICT'
        });
      }
      dept.hod = hod;
    } else if (hod === null || hod === '') {
      dept.hod = null;
    }

    if (name) dept.name = name.trim();
    if (code) dept.code = code.toUpperCase().trim();
    if (intakeCapacity !== undefined) dept.intakeCapacity = intakeCapacity;
    if (description !== undefined) dept.description = description ? description.trim() : '';
    if (isActive !== undefined) dept.isActive = isActive;

    await dept.save();
    await dept.populate('hod', 'name email role department');

    await recordAuditLog({
      req,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: dept._id,
      details: { code: dept.code, name: dept.name, hod: dept.hod ? dept.hod.name : 'Unassigned' }
    });

    return sendSuccess(res, {
      message: 'Department updated successfully',
      data: dept
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment
};
