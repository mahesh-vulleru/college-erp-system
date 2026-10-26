const Course = require('./course.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function listCourses(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    const courses = await Course.find(query).populate('department', 'name code');
    return sendSuccess(res, {
      message: 'Courses retrieved successfully',
      data: courses,
      meta: { count: courses.length }
    });
  } catch (error) {
    next(error);
  }
}

async function getCourseById(req, res, next) {
  try {
    const course = await Course.findById(req.params.id).populate('department', 'name code');
    if (!course) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Course not found',
        code: 'NOT_FOUND'
      });
    }
    return sendSuccess(res, { data: course });
  } catch (error) {
    next(error);
  }
}

async function createCourse(req, res, next) {
  try {
    const { name, code, department, degreeType, durationSemesters, totalCredits } = req.body;
    const existing = await Course.findOne({ code });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Course code already exists',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const course = await Course.create({
      name,
      code,
      department,
      degreeType,
      durationSemesters,
      totalCredits
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCourses,
  getCourseById,
  createCourse
};

