const Course = require('./course.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { resolveHodDepartment, isHodDepartment } = require('../../utils/hodScoping');

async function listCourses(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
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

    if (req.user?.role === ROLES.HOD && department) {
      const matches = await isHodDepartment(req.user, department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only create courses within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }
    const cleanCode = (code || '').toUpperCase().trim();
    const existing = await Course.findOne({ code: cleanCode });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Course code already exists',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const course = await Course.create({
      name: (name || '').trim(),
      code: cleanCode,
      department,
      degreeType: degreeType || 'B.Tech',
      durationSemesters: Number(durationSemesters) || 8,
      totalCredits: Number(totalCredits) || 160
    });

    await course.populate('department', 'name code');

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const { name, code, department, degreeType, durationSemesters, totalCredits, isActive } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Course not found',
        code: 'NOT_FOUND'
      });
    }

    if (req.user?.role === ROLES.HOD && course.department) {
      const matches = await isHodDepartment(req.user, course.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only update courses within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }

    if (code && code.toUpperCase().trim() !== course.code) {
      const cleanCode = code.toUpperCase().trim();
      const existing = await Course.findOne({ code: cleanCode, _id: { $ne: course._id } });
      if (existing) {
        return sendError(res, {
          statusCode: HTTP_STATUS.CONFLICT,
          message: 'Another course already uses this code',
          code: 'DUPLICATE_RESOURCE'
        });
      }
      course.code = cleanCode;
    }

    if (name) course.name = name.trim();
    if (department) course.department = department;
    if (degreeType) course.degreeType = degreeType;
    if (durationSemesters !== undefined) course.durationSemesters = Number(durationSemesters);
    if (totalCredits !== undefined) course.totalCredits = Number(totalCredits);
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();
    await course.populate('department', 'name code');

    return sendSuccess(res, {
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Course not found',
        code: 'NOT_FOUND'
      });
    }

    // Soft archive rather than hard delete to preserve historical integrity
    course.isActive = false;
    await course.save();

    return sendSuccess(res, {
      message: 'Course archived successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
