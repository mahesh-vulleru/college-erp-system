const Subject = require('./subject.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function listSubjects(req, res, next) {
  try {
    const query = {};
    if (req.query.course) query.course = req.query.course;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);
    if (req.query.department) query.department = req.query.department;

    const subjects = await Subject.find(query).populate('course', 'name code').populate('department', 'name code');
    return sendSuccess(res, {
      message: 'Subjects retrieved successfully',
      data: subjects,
      meta: { count: subjects.length }
    });
  } catch (error) {
    next(error);
  }
}

async function createSubject(req, res, next) {
  try {
    const { name, code, course, department, semester, credits, isLab, syllabusUrl } = req.body;
    const existing = await Subject.findOne({ code });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Subject code already exists',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const subject = await Subject.create({
      name,
      code,
      course,
      department,
      semester,
      credits,
      isLab,
      syllabusUrl
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSubjects,
  createSubject
};

