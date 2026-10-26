const Faculty = require('./faculty.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function listFaculty(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.designation) query.designation = req.query.designation;

    const facultyList = await Faculty.find(query)
      .populate('user', 'name email status')
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

async function getFacultyById(req, res, next) {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email status')
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

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Faculty profile created successfully',
      data: faculty
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFaculty,
  getFacultyById,
  createFacultyProfile
};

