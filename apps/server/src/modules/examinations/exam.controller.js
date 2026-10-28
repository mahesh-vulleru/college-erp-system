const Examination = require('./exam.model');
const Department = require('../departments/department.model');
const Student = require('../students/student.model');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');

async function listExams(req, res, next) {
  try {
    const query = {};
    if (req.query.semester) {
      const sem = parseInt(req.query.semester, 10);
      if (!isNaN(sem)) query.semester = sem;
    }
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    if (req.query.examType) query.examType = req.query.examType;
    if (req.query.status) query.status = req.query.status;

    if (req.query.department) {
      const deptVal = String(req.query.department).trim();
      if (deptVal && deptVal !== '[object Object]') {
        if (mongoose.Types.ObjectId.isValid(deptVal)) {
          query.department = deptVal;
        } else {
          const foundDept = await Department.findOne({
            $or: [{ code: deptVal.toUpperCase() }, { name: deptVal }]
          });
          if (foundDept) {
            query.department = foundDept._id;
          } else {
            return sendError(res, {
              statusCode: HTTP_STATUS.BAD_REQUEST,
              message: `Department '${deptVal}' not found`,
              code: 'INVALID_DEPARTMENT'
            });
          }
        }
      }
    }

    if (req.user && req.user.role === ROLES.STUDENT) {
      query.isPublished = true;
      query.status = { $ne: 'cancelled' };
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (studentProfile) {
        if (studentProfile.department) query.department = studentProfile.department;
        if (studentProfile.currentSemester) query.semester = studentProfile.currentSemester;
      }
    } else if (req.user && req.user.role === ROLES.HOD && !query.department) {
      const dept = await Department.findOne({ hod: req.user._id });
      if (dept) query.department = dept._id;
    }

    const exams = await Examination.find(query)
      .populate('department', 'name code')
      .populate('course', 'name code degreeType')
      .sort({ startDate: -1 });

    return sendSuccess(res, {
      message: 'Examinations list retrieved',
      data: exams,
      meta: { count: exams.length }
    });
  } catch (error) {
    next(error);
  }
}

async function getExamById(req, res, next) {
  try {
    const exam = await Examination.findById(req.params.id)
      .populate('department', 'name code')
      .populate('course', 'name code degreeType');

    if (!exam) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: exam });
  } catch (error) {
    next(error);
  }
}

async function createExam(req, res, next) {
  try {
    const { name, examType, academicYear, semester, department, course, venue, startDate, endDate, isPublished, status } = req.body;

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (parsedStart > parsedEnd) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Examination start date cannot be later than end date',
        code: 'INVALID_DATE_RANGE'
      });
    }

    // Venue Conflict check: check if venue is occupied by another exam in overlapping timeframe
    if (venue && venue.trim()) {
      const venueConflict = await Examination.findOne({
        venue: venue.trim(),
        status: { $ne: 'cancelled' },
        $or: [
          { startDate: { $lte: parsedEnd }, endDate: { $gte: parsedStart } }
        ]
      });

      if (venueConflict) {
        return sendError(res, {
          statusCode: HTTP_STATUS.CONFLICT,
          message: `Venue clash: '${venue.trim()}' is already booked for '${venueConflict.name}' between ${new Date(venueConflict.startDate).toLocaleDateString()} and ${new Date(venueConflict.endDate).toLocaleDateString()}.`,
          code: 'VENUE_CONFLICT'
        });
      }
    }

    const exam = await Examination.create({
      name: (name || '').trim(),
      examType: examType || 'Semester End',
      academicYear: (academicYear || '').trim(),
      semester: Number(semester),
      department: department || null,
      course: course || null,
      venue: (venue || 'Main Examination Hall').trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
      isPublished: Boolean(isPublished),
      status: status || 'scheduled'
    });

    const populated = await Examination.findById(exam._id)
      .populate('department', 'name code')
      .populate('course', 'name code');

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Examination schedule created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
}

async function updateExam(req, res, next) {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'NOT_FOUND'
      });
    }

    const { name, examType, academicYear, semester, department, course, venue, startDate, endDate, isPublished, status } = req.body;

    const newStart = startDate ? new Date(startDate) : exam.startDate;
    const newEnd = endDate ? new Date(endDate) : exam.endDate;

    if (newStart > newEnd) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Examination start date cannot be later than end date',
        code: 'INVALID_DATE_RANGE'
      });
    }

    const checkVenue = venue !== undefined ? venue.trim() : exam.venue;
    if (checkVenue && (status !== 'cancelled')) {
      const venueConflict = await Examination.findOne({
        _id: { $ne: exam._id },
        venue: checkVenue,
        status: { $ne: 'cancelled' },
        $or: [
          { startDate: { $lte: newEnd }, endDate: { $gte: newStart } }
        ]
      });

      if (venueConflict) {
        return sendError(res, {
          statusCode: HTTP_STATUS.CONFLICT,
          message: `Venue clash: '${checkVenue}' is already reserved for '${venueConflict.name}'.`,
          code: 'VENUE_CONFLICT'
        });
      }
    }

    if (name) exam.name = name.trim();
    if (examType) exam.examType = examType;
    if (academicYear) exam.academicYear = academicYear.trim();
    if (semester !== undefined) exam.semester = Number(semester);
    if (department !== undefined) exam.department = department;
    if (course !== undefined) exam.course = course;
    if (venue !== undefined) exam.venue = venue.trim();
    if (startDate) exam.startDate = newStart;
    if (endDate) exam.endDate = newEnd;
    if (isPublished !== undefined) exam.isPublished = Boolean(isPublished);
    if (status) exam.status = status;

    await exam.save();

    const populated = await Examination.findById(exam._id)
      .populate('department', 'name code')
      .populate('course', 'name code');

    return sendSuccess(res, {
      message: 'Examination schedule updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteExam(req, res, next) {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'NOT_FOUND'
      });
    }

    // Mark as cancelled rather than deleting historical results
    exam.status = 'cancelled';
    await exam.save();

    return sendSuccess(res, {
      message: 'Examination cancelled successfully',
      data: exam
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam
};
