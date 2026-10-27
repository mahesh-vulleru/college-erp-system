const Timetable = require('./timetable.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function getTimetable(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.course) query.course = req.query.course;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);
    if (req.query.section) query.section = req.query.section.toUpperCase();
    if (req.query.dayOfWeek) query.dayOfWeek = req.query.dayOfWeek;
    if (req.query.faculty) query.faculty = req.query.faculty;

    const slots = await Timetable.find(query)
      .populate('subject', 'name code credits isLab')
      .populate({
        path: 'faculty',
        select: 'employeeId designation qualification',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('department', 'name code')
      .populate('course', 'name code degreeType')
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

async function checkTimetableConflicts({ dayOfWeek, periodNumber, roomNumber, faculty, department, semester, section, excludeId = null }) {
  const baseFilter = {
    dayOfWeek,
    periodNumber: Number(periodNumber)
  };
  if (excludeId) {
    baseFilter._id = { $ne: excludeId };
  }

  // 1. Check Faculty Clash
  if (faculty) {
    const facultyConflict = await Timetable.findOne({
      ...baseFilter,
      faculty
    }).populate('subject', 'name code');
    if (facultyConflict) {
      return `Faculty conflict: This instructor is already scheduled for ${facultyConflict.subject?.code || 'another class'} during ${dayOfWeek} Period ${periodNumber}.`;
    }
  }

  // 2. Check Classroom / Lab Clash
  if (roomNumber && roomNumber.trim()) {
    const roomConflict = await Timetable.findOne({
      ...baseFilter,
      roomNumber: roomNumber.trim()
    }).populate('subject', 'name code');
    if (roomConflict) {
      return `Room conflict: Room/Lab '${roomNumber.trim()}' is already booked for ${roomConflict.subject?.code || 'another class'} during ${dayOfWeek} Period ${periodNumber}.`;
    }
  }

  // 3. Check Section / Class Clash
  if (department && semester && section) {
    const sectionConflict = await Timetable.findOne({
      ...baseFilter,
      department,
      semester: Number(semester),
      section: section.toUpperCase()
    }).populate('subject', 'name code');
    if (sectionConflict) {
      return `Section conflict: Semester ${semester} Section ${section.toUpperCase()} already has a class scheduled during ${dayOfWeek} Period ${periodNumber}.`;
    }
  }

  return null;
}

async function createTimetableSlot(req, res, next) {
  try {
    const { department, course, semester, section = 'A', dayOfWeek, periodNumber, startTime, endTime, subject, faculty, roomNumber } = req.body;

    const conflictError = await checkTimetableConflicts({
      dayOfWeek,
      periodNumber,
      roomNumber,
      faculty,
      department,
      semester,
      section
    });

    if (conflictError) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: conflictError,
        code: 'SCHEDULE_CONFLICT'
      });
    }

    const slot = await Timetable.create({
      department,
      course,
      semester: Number(semester),
      section: (section || 'A').toUpperCase().trim(),
      dayOfWeek,
      periodNumber: Number(periodNumber),
      startTime,
      endTime,
      subject,
      faculty,
      roomNumber: (roomNumber || '').trim()
    });

    const populated = await Timetable.findById(slot._id)
      .populate('subject', 'name code credits')
      .populate({
        path: 'faculty',
        select: 'employeeId designation',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('department', 'name code');

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Timetable slot created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
}

async function updateTimetableSlot(req, res, next) {
  try {
    const slot = await Timetable.findById(req.params.id);
    if (!slot) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Timetable slot not found',
        code: 'NOT_FOUND'
      });
    }

    const { department, course, semester, section, dayOfWeek, periodNumber, startTime, endTime, subject, faculty, roomNumber } = req.body;

    const conflictError = await checkTimetableConflicts({
      dayOfWeek: dayOfWeek || slot.dayOfWeek,
      periodNumber: periodNumber !== undefined ? periodNumber : slot.periodNumber,
      roomNumber: roomNumber !== undefined ? roomNumber : slot.roomNumber,
      faculty: faculty || slot.faculty,
      department: department || slot.department,
      semester: semester !== undefined ? semester : slot.semester,
      section: section || slot.section,
      excludeId: slot._id
    });

    if (conflictError) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: conflictError,
        code: 'SCHEDULE_CONFLICT'
      });
    }

    if (department) slot.department = department;
    if (course) slot.course = course;
    if (semester !== undefined) slot.semester = Number(semester);
    if (section) slot.section = section.toUpperCase().trim();
    if (dayOfWeek) slot.dayOfWeek = dayOfWeek;
    if (periodNumber !== undefined) slot.periodNumber = Number(periodNumber);
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (subject) slot.subject = subject;
    if (faculty) slot.faculty = faculty;
    if (roomNumber !== undefined) slot.roomNumber = roomNumber.trim();

    await slot.save();

    const populated = await Timetable.findById(slot._id)
      .populate('subject', 'name code credits')
      .populate({
        path: 'faculty',
        select: 'employeeId designation',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('department', 'name code');

    return sendSuccess(res, {
      message: 'Timetable slot updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteTimetableSlot(req, res, next) {
  try {
    const slot = await Timetable.findByIdAndDelete(req.params.id);
    if (!slot) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Timetable slot not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, {
      message: 'Timetable slot cancelled/removed successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot
};
