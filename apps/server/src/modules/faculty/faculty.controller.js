const Faculty = require('./faculty.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');
const { resolveHodDepartment, isHodDepartment } = require('../../utils/hodScoping');
const Department = require('../departments/department.model');
const mongoose = require('mongoose');

async function listFaculty(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.designation) query.designation = req.query.designation;
    if (req.query.user) query.user = req.query.user;

    // Enforce HOD department-level scoping to ensure cross-department data isolation
    if (req.user?.role === ROLES.HOD) {
      const dept = await resolveHodDepartment(req.user);
      if (dept) {
        if (req.query.department) {
          const matches = await isHodDepartment(req.user, req.query.department);
          if (!matches) {
            return sendError(res, {
              statusCode: HTTP_STATUS.FORBIDDEN,
              message: 'Forbidden: HOD can only view faculty within their assigned department',
              code: 'FORBIDDEN'
            });
          }
        }
        query.department = dept._id;
      }
    }

    const facultyList = await Faculty.find(query)
      .populate('user', 'name email status role lastLogin')
      .populate('department', 'name code');

    return sendSuccess(res, {
      message: 'Faculty members retrieved successfully',
      data: facultyList,
      meta: { count: facultyList.length }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyFacultyProfile(req, res, next) {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id })
      .populate('user', 'name email status role lastLogin')
      .populate('department', 'name code');

    if (!faculty) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'No faculty profile associated with this account',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: faculty });
  } catch (error) {
    next(error);
  }
}

async function getFacultyById(req, res, next) {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email status role lastLogin')
      .populate('department', 'name code');

    if (!faculty) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Faculty record not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: faculty });
  } catch (error) {
    next(error);
  }
}

async function createFacultyProfile(req, res, next) {
  try {
    const { user, employeeId, department, designation, qualification, specialization } = req.body;

    if (req.user?.role === ROLES.HOD && department) {
      const matches = await isHodDepartment(req.user, department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only create faculty profiles within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }

    const existing = await Faculty.findOne({ $or: [{ employeeId }, { user }] });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Faculty profile already exists for this user or employee ID',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const faculty = await Faculty.create({
      user,
      employeeId,
      department,
      designation,
      qualification,
      specialization
    });

    await recordAuditLog({
      req,
      action: 'FACULTY_PROFILE_CREATED',
      entityType: 'Faculty',
      entityId: faculty._id,
      details: { employeeId: faculty.employeeId, designation: faculty.designation }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Faculty profile created successfully',
      data: faculty
    });
  } catch (error) {
    next(error);
  }
}

async function updateFacultyProfile(req, res, next) {
  try {
    const { department, designation, qualification, specialization } = req.body;
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Faculty profile not found',
        code: 'NOT_FOUND'
      });
    }

    if (req.user?.role === ROLES.HOD && faculty.department) {
      const matches = await isHodDepartment(req.user, faculty.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only update faculty profiles within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }

    if (department) faculty.department = department;
    if (designation) faculty.designation = designation;
    if (qualification !== undefined) faculty.qualification = qualification;
    if (specialization !== undefined) faculty.specialization = specialization;

    await faculty.save();
    await faculty.populate('user', 'name email status role lastLogin');
    await faculty.populate('department', 'name code');

    await recordAuditLog({
      req,
      action: 'FACULTY_PROFILE_UPDATED',
      entityType: 'Faculty',
      entityId: faculty._id,
      details: { employeeId: faculty.employeeId, designation: faculty.designation }
    });

    return sendSuccess(res, {
      message: 'Faculty profile updated successfully',
      data: faculty
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFaculty,
  getFacultyById,
  getMyFacultyProfile,
  createFacultyProfile,
  updateFacultyProfile
};
