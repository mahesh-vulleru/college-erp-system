const Timetable = require('./timetable.model');
const { sendSuccess } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function getTimetable(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);
    if (req.query.dayOfWeek) query.dayOfWeek = req.query.dayOfWeek;
    if (req.query.faculty) query.faculty = req.query.faculty;

    const slots = await Timetable.find(query)
      .populate('subject', 'name code')
      .populate('faculty', 'employeeId')
      .populate('department', 'name code')
      .sort({ dayOfWeek: 1, periodNumber: 1 });

    return sendSuccess(res, {
      message: 'Timetable retrieved successfully',
      data: slots,
      meta: { count: slots.length, isScaffold: false }
    });
  } catch (error) {
    next(error);
  }
}

async function createTimetableSlot(req, res, next) {
  try {
    const slot = await Timetable.create(req.body);
    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Timetable slot created successfully',
      data: slot
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTimetable,
  createTimetableSlot
};

