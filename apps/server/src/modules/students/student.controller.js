const Student = require('./student.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

async function listStudents(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.semester) query.currentSemester = parseInt(req.query.semester, 10);
    if (req.query.batch) query.batchYear = req.query.batch;
    if (req.query.status) query.admissionStatus = req.query.status;

    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ rollNumber: regex }, { enrollmentNumber: regex }];
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('user', 'name email status lastLogin')
        .populate('department', 'name code')
        .populate('course', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ rollNumber: 1 }),
      Student.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Students retrieved successfully',
      data: students,
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

async function getStudentById(req, res, next) {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email status lastLogin')
      .populate('department', 'name code')
      .populate('course', 'name code');

    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Student record not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: student });
  } catch (error) {
    next(error);
  }
}

async function getMyStudentProfile(req, res, next) {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name email status lastLogin')
      .populate('department', 'name code')
      .populate('course', 'name code');

    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'No student profile associated with this account',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: student });
  } catch (error) {
    next(error);
  }
}

async function createStudentProfile(req, res, next) {
  try {
    const { user, rollNumber, enrollmentNumber, department, course, currentSemester, batchYear, guardianName, guardianPhone, admissionStatus } = req.body;

    const existing = await Student.findOne({ $or: [{ rollNumber }, { user }] });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Student profile already exists with this user or roll number',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const student = await Student.create({
      user,
      rollNumber,
      enrollmentNumber,
      department,
      course,
      currentSemester: currentSemester || 1,
      batchYear,
      guardianName,
      guardianPhone,
      admissionStatus: admissionStatus || 'enrolled'
    });

    await recordAuditLog({
      req,
      action: 'STUDENT_PROFILE_CREATED',
      entityType: 'Student',
      entityId: student._id,
      details: { rollNumber: student.rollNumber, semester: student.currentSemester }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Student profile created successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
}

async function updateStudentProfile(req, res, next) {
  try {
    const { department, course, currentSemester, batchYear, guardianName, guardianPhone, admissionStatus } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Student profile not found',
        code: 'NOT_FOUND'
      });
    }

    if (department) student.department = department;
    if (course) student.course = course;
    if (currentSemester !== undefined) student.currentSemester = currentSemester;
    if (batchYear) student.batchYear = batchYear;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (admissionStatus) student.admissionStatus = admissionStatus;

    await student.save();
    await student.populate('user', 'name email status lastLogin');
    await student.populate('department', 'name code');
    await student.populate('course', 'name code');

    await recordAuditLog({
      req,
      action: 'STUDENT_PROFILE_UPDATED',
      entityType: 'Student',
      entityId: student._id,
      details: { rollNumber: student.rollNumber, semester: student.currentSemester, status: student.admissionStatus }
    });

    return sendSuccess(res, {
      message: 'Student profile updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listStudents,
  getStudentById,
  getMyStudentProfile,
  createStudentProfile,
  updateStudentProfile
};
