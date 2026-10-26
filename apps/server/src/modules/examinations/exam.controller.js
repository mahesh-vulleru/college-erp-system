const Examination = require('./exam.model');
const { sendSuccess } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function listExams(req, res, next) {
  try {
    const query = {};
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);
    if (req.query.academicYear) query.academicYear = req.query.academicYear;

    const exams = await Examination.find(query).sort({ startDate: -1 });

    return sendSuccess(res, {
      message: 'Examinations list retrieved',
      data: exams,
      meta: { count: exams.length }
    });
  } catch (error) {
    next(error);
  }
}

async function createExam(req, res, next) {
  try {
    const exam = await Examination.create(req.body);
    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Examination schedule created successfully',
      data: exam
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listExams,
  createExam
};

