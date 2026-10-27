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
    const { name, code, hod, intakeCapacity, description, reassignHod } = req.body;
    const trimmedName = name ? name.trim() : '';
    const formattedCode = code ? code.toUpperCase().trim() : '';

    const existing = await Department.findOne({
      $or: [
        { code: formattedCode },
        { name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } }
      ]
    });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: existing.code === formattedCode
          ? `Department with code '${formattedCode}' already exists`
          : `Department with name '${trimmedName}' already exists`,
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const targetHodId = (hod && typeof hod === 'object') ? hod._id : hod;
    if (targetHodId && targetHodId !== 'null' && targetHodId !== 'unassigned' && targetHodId !== '') {
      const existingHod = await Department.findOne({ hod: targetHodId });
      if (existingHod) {
        if (reassignHod) {
          await Department.updateOne({ _id: existingHod._id }, { $set: { hod: null } });
        } else {
          return sendError(res, {
            statusCode: HTTP_STATUS.CONFLICT,
            message: `This HOD is already assigned to the '${existingHod.name}' department. Reassign them first.`,
            code: 'HOD_ASSIGNMENT_CONFLICT'
          });
        }
      }
    }

    const dept = await Department.create({
      name: trimmedName,
      code: formattedCode,
      hod: targetHodId || null,
      intakeCapacity: intakeCapacity || 60,
      description: description ? description.trim() : ''
    });

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
    const { name, code, hod, intakeCapacity, description, isActive, reassignHod } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Department not found',
        code: 'NOT_FOUND'
      });
    }

    if (name) {
      const trimmedName = name.trim();
      if (trimmedName.toLowerCase() !== dept.name.toLowerCase()) {
        const existingName = await Department.findOne({
          name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
          _id: { $ne: dept._id }
        });
        if (existingName) {
          return sendError(res, {
            statusCode: HTTP_STATUS.CONFLICT,
            message: `Department with name '${trimmedName}' already exists`,
            code: 'DUPLICATE_RESOURCE'
          });
        }
      }
      dept.name = trimmedName;
    }

    if (code) {
      const formattedCode = code.toUpperCase().trim();
      if (formattedCode !== dept.code) {
        const existingCode = await Department.findOne({
          code: formattedCode,
          _id: { $ne: dept._id }
        });
        if (existingCode) {
          return sendError(res, {
            statusCode: HTTP_STATUS.CONFLICT,
            message: `Department with code '${formattedCode}' already exists`,
            code: 'DUPLICATE_RESOURCE'
          });
        }
      }
      dept.code = formattedCode;
    }

    if (hod !== undefined) {
      const targetHodId = (hod && typeof hod === 'object') ? hod._id : hod;
      if (targetHodId && targetHodId !== 'null' && targetHodId !== 'unassigned' && targetHodId !== '') {
        // Check for conflict: ensure HOD is not assigned to another department
        const existingHodDept = await Department.findOne({
          hod: targetHodId,
          _id: { $ne: dept._id }
        });
        if (existingHodDept) {
          if (reassignHod) {
            await Department.updateOne({ _id: existingHodDept._id }, { $set: { hod: null } });
            dept.hod = targetHodId;
          } else {
            return sendError(res, {
              statusCode: HTTP_STATUS.CONFLICT,
              message: `This HOD is already assigned to the '${existingHodDept.name}' department. Reassign them first.`,
              code: 'HOD_ASSIGNMENT_CONFLICT'
            });
          }
        } else {
          dept.hod = targetHodId;
        }
      } else {
        dept.hod = null;
      }
    }

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
