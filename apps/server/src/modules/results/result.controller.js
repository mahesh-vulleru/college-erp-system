const Result = require('./result.model');
const Student = require('../students/student.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');

async function getResults(req, res, next) {
  try {
    const query = {};
    if (req.query.examination) query.examination = req.query.examination;
    if (req.query.student) query.student = req.query.student;

    if (req.user.role === ROLES.STUDENT) {
      const profile = await Student.findOne({ user: req.user._id });
      if (!profile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      query.student = profile._id;
    }

    const results = await Result.find(query)
      .populate('examination', 'name examType academicYear')
      .populate('subject', 'name code credits')
      .populate('student', 'rollNumber');

    return sendSuccess(res, {
      message: 'Examination results retrieved',
      data: results,
      meta: { count: results.length }
    });
  } catch (error) {
    next(error);
  }
}

async function recordResult(req, res, next) {
  try {
    const { examination, student, subject, internalMarks = 0, externalMarks = 0 } = req.body;
    const totalMarks = internalMarks + externalMarks;

    let grade = 'F';
    let status = 'failed';
    if (totalMarks >= 90) { grade = 'O'; status = 'passed'; }
    else if (totalMarks >= 80) { grade = 'A+'; status = 'passed'; }
    else if (totalMarks >= 70) { grade = 'A'; status = 'passed'; }
    else if (totalMarks >= 60) { grade = 'B+'; status = 'passed'; }
    else if (totalMarks >= 50) { grade = 'B'; status = 'passed'; }
    else if (totalMarks >= 40) { grade = 'C'; status = 'passed'; }

    const result = await Result.findOneAndUpdate(
      { examination, student, subject },
      { internalMarks, externalMarks, totalMarks, grade, status },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Marks entered and grade computed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getResults,
  recordResult
};

