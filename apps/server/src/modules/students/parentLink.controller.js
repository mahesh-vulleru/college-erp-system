const mongoose = require('mongoose');
const ParentStudentLink = require('./parentStudentLink.model');
const Student = require('./student.model');
const User = require('../auth/auth.model');
const { ROLES, HTTP_STATUS } = require('@college-erp/shared');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * List all verified children linked to the currently authenticated parent
 */
async function listMyChildren(req, res, next) {
  try {
    const parentUserId = req.user._id;

    const links = await ParentStudentLink.find({
      parent: parentUserId,
      status: 'active'
    })
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email phone avatar' },
          { path: 'department', select: 'name code' },
          { path: 'course', select: 'name code' }
        ]
      })
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean();

    const children = (Array.isArray(links) ? links : [])
      .filter((l) => l.student && l.student.user)
      .map((link) => ({
        linkId: link._id,
        relationship: link.relationship,
        isPrimary: link.isPrimary,
        permissions: link.permissions,
        studentId: link.student._id,
        rollNumber: link.student.rollNumber,
        enrollmentNumber: link.student.enrollmentNumber,
        name: link.student.user?.name || 'Student',
        email: link.student.user?.email,
        phone: link.student.user?.phone,
        department: link.student.department?.name || 'Department',
        course: link.student.course?.name || 'Course',
        semester: link.student.currentSemester,
        batchYear: link.student.batchYear,
        admissionStatus: link.student.admissionStatus
      }));

    return sendSuccess(res, {
      message: 'Verified linked children retrieved successfully',
      data: children
    });
  } catch (error) {
    logger.error('Error fetching parent linked children:', error);
    next(error);
  }
}

/**
 * Administrative: Link a parent user account to a student profile
 * (Super Admin, Principal)
 */
async function createParentLink(req, res, next) {
  try {
    const { parentId, studentId, relationship, isPrimary, permissions, notes } = req.body;

    if (!parentId || !studentId) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Both parentId (User ID) and studentId (Student ID) are required.'
      });
    }

    // Verify parent user exists and has PARENT role
    const parentUser = await User.findById(parentId);
    if (!parentUser) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Parent user account not found.'
      });
    }

    if (parentUser.role !== ROLES.PARENT) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `User ${parentUser.email} has role "${parentUser.role}", but role "${ROLES.PARENT}" is required for parent links.`
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Student profile not found.'
      });
    }

    // Check for existing link
    let existingLink = await ParentStudentLink.findOne({ parent: parentId, student: studentId });
    if (existingLink) {
      existingLink.status = 'active';
      if (relationship) existingLink.relationship = relationship;
      if (typeof isPrimary === 'boolean') existingLink.isPrimary = isPrimary;
      if (permissions) existingLink.permissions = { ...existingLink.permissions, ...permissions };
      if (notes) existingLink.notes = notes;
      existingLink.verifiedBy = req.user._id;
      await existingLink.save();

      return sendSuccess(res, {
        message: 'Parent-student link updated successfully',
        data: existingLink
      });
    }

    const newLink = await ParentStudentLink.create({
      parent: parentId,
      student: studentId,
      relationship: relationship || 'Guardian',
      isPrimary: typeof isPrimary === 'boolean' ? isPrimary : true,
      permissions: permissions || {
        canViewAcademics: true,
        canViewAttendance: true,
        canViewFees: true,
        canViewTransport: true
      },
      verifiedBy: req.user._id,
      status: 'active',
      notes
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Parent-student link created successfully',
      data: newLink
    });
  } catch (error) {
    logger.error('Error creating parent link:', error);
    next(error);
  }
}

/**
 * Administrative: List all parent-student links with pagination & search
 */
async function listParentLinks(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;

    const [total, links] = await Promise.all([
      ParentStudentLink.countDocuments(query),
      ParentStudentLink.find(query)
        .populate('parent', 'name email phone status')
        .populate({
          path: 'student',
          populate: [
            { path: 'user', select: 'name email phone' },
            { path: 'department', select: 'name code' }
          ]
        })
        .populate('verifiedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return sendSuccess(res, {
      message: 'Parent-student links retrieved',
      data: {
        links,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Error listing parent links:', error);
    next(error);
  }
}

/**
 * Administrative: Update a parent-student link
 */
async function updateParentLink(req, res, next) {
  try {
    const { id } = req.params;
    const { relationship, status, permissions, isPrimary, notes } = req.body;

    const link = await ParentStudentLink.findById(id);
    if (!link) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Parent-student link not found.'
      });
    }

    if (relationship) link.relationship = relationship;
    if (status) link.status = status;
    if (typeof isPrimary === 'boolean') link.isPrimary = isPrimary;
    if (permissions) link.permissions = { ...link.permissions, ...permissions };
    if (notes !== undefined) link.notes = notes;
    link.verifiedBy = req.user._id;

    await link.save();

    return sendSuccess(res, {
      message: 'Parent-student link updated successfully',
      data: link
    });
  } catch (error) {
    logger.error('Error updating parent link:', error);
    next(error);
  }
}

/**
 * Administrative: Remove a parent-student link
 */
async function deleteParentLink(req, res, next) {
  try {
    const { id } = req.params;
    const link = await ParentStudentLink.findByIdAndDelete(id);
    if (!link) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Parent-student link not found.'
      });
    }

    return sendSuccess(res, {
      message: 'Parent-student link deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting parent link:', error);
    next(error);
  }
}

module.exports = {
  listMyChildren,
  createParentLink,
  listParentLinks,
  updateParentLink,
  deleteParentLink
};
