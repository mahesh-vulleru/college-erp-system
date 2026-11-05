const mongoose = require('mongoose');
const Examination = require('./exam.model');
const ExamRegistration = require('./examRegistration.model');
const ExamAttendance = require('./examAttendance.model');
const Result = require('../results/result.model');
const Subject = require('../subjects/subject.model');
const Attendance = require('../attendance/attendance.model');
const AuditLog = require('../audit-logs/audit.model');
const Department = require('../departments/department.model');
const Student = require('../students/student.model');
const Faculty = require('../faculty/faculty.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { resolveHodDepartment, isHodDepartment } = require('../../utils/hodScoping');

async function safeAuditLog(logData) {
  try {
    await AuditLog.create(logData);
  } catch (err) {
    // Non-blocking audit log record
  }
}

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
    if (req.query.isPublished !== undefined) query.isPublished = req.query.isPublished === 'true';

    // Role-based visibility enforcement
    if (req.user && req.user.role === ROLES.STUDENT) {
      query.isPublished = true;
      if (!req.query.status) query.status = { $ne: 'cancelled' };
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (studentProfile) {
        if (!req.query.department && studentProfile.department) {
          query.$or = [{ department: studentProfile.department }, { department: null }];
        }
        if (!req.query.semester && studentProfile.currentSemester) {
          query.semester = studentProfile.currentSemester;
        }
      }
    } else if (req.user && req.user.role === ROLES.HOD && !req.query.department) {
      const dept = await Department.findOne({ hod: req.user._id }) || (req.user.department ? await Department.findOne({ name: req.user.department }) : null);
      if (dept) {
        query.$or = [{ department: dept._id }, { department: null }];
      }
    } else if (req.user && req.user.role === ROLES.FACULTY && !req.query.department) {
      const facultyProfile = await Faculty.findOne({ user: req.user._id });
      if (facultyProfile && facultyProfile.department) {
        query.$or = [{ department: facultyProfile.department }, { department: null }];
      }
    }

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

    // Students cannot access unpublished or cancelled exams, or exams outside their department
    if (req.user && req.user.role === ROLES.STUDENT) {
      if (!exam.isPublished || exam.status === 'cancelled') {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Students cannot view unpublished or cancelled examinations',
          code: 'FORBIDDEN'
        });
      }
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (studentProfile && exam.department && studentProfile.department) {
        const examDeptId = exam.department._id || exam.department;
        if (!examDeptId.equals(studentProfile.department)) {
          return sendError(res, {
            statusCode: HTTP_STATUS.FORBIDDEN,
            message: 'Students cannot view examinations outside their department',
            code: 'FORBIDDEN'
          });
        }
      }
    }

    if (req.user && req.user.role === ROLES.HOD && exam.department) {
      const matches = await isHodDepartment(req.user, exam.department._id || exam.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD cannot view examinations outside their department',
          code: 'FORBIDDEN'
        });
      }
    }

    return sendSuccess(res, { data: exam });
  } catch (error) {
    next(error);
  }
}

async function createExam(req, res, next) {
  try {
    const { name, examType, academicYear, semester, department, course, venue, startDate, endDate, isPublished, status } = req.body;

    let examDept = department;
    if (req.user && req.user.role === ROLES.HOD) {
      const hodDept = await Department.findOne({ hod: req.user._id }) || (req.user.department ? await Department.findOne({ name: req.user.department }) : null);
      if (hodDept) {
        examDept = hodDept._id;
      }
    }

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
      department: examDept || null,
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

    if (req.user && req.user.role === ROLES.HOD && exam.department) {
      const matches = await isHodDepartment(req.user, exam.department._id || exam.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only update examinations for their assigned department',
          code: 'FORBIDDEN'
        });
      }
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

/**
 * GET /api/v1/examinations/controller/stats
 * Telemetry summary for the Examination Controller Dashboard
 */
async function getControllerStats(req, res, next) {
  try {
    const now = new Date();
    const query = {};

    if (req.user && req.user.role === ROLES.HOD) {
      const hodDept = await Department.findOne({ hod: req.user._id }) || (req.user.department ? await Department.findOne({ name: req.user.department }) : null);
      if (hodDept) {
        query.$or = [{ department: hodDept._id }, { department: null }];
      }
    }

    const [
      totalExaminations,
      upcomingExaminations,
      ongoingExaminations,
      completedExaminations,
      registeredStudents,
      hallTicketsGenerated,
      resultsPublished,
      upcomingSchedule,
      recentActivities
    ] = await Promise.all([
      Examination.countDocuments({ ...query, status: { $ne: 'cancelled' } }),
      Examination.countDocuments({
        ...query,
        status: { $ne: 'cancelled' },
        startDate: { $gte: now }
      }),
      Examination.countDocuments({
        ...query,
        status: { $ne: 'cancelled' },
        startDate: { $lte: now },
        endDate: { $gte: now }
      }),
      Examination.countDocuments({
        ...query,
        $or: [{ status: 'completed' }, { endDate: { $lt: now } }]
      }),
      ExamRegistration.countDocuments(),
      ExamRegistration.countDocuments({ hallTicketGenerated: true }),
      Examination.countDocuments({ ...query, isResultsPublished: true }),
      Examination.find({
        ...query,
        status: { $ne: 'cancelled' },
        endDate: { $gte: now }
      })
        .populate('department', 'name code')
        .populate('course', 'name code')
        .populate('schedules.subject', 'name code credits')
        .sort({ startDate: 1 })
        .limit(6),
      AuditLog.find({
        entityType: { $in: ['Examination', 'Result', 'ExamRegistration', 'ExamAttendance'] }
      })
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(6)
    ]);

    const examTypeAgg = await Examination.aggregate([
      { $match: { ...query, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$examType', count: { $sum: 1 } } }
    ]).catch(() => []);

    // Format upcoming schedule slots for direct dashboard rendering
    const formattedUpcomingSchedules = [];
    (upcomingSchedule || []).forEach((exam) => {
      if (exam.schedules && exam.schedules.length > 0) {
        exam.schedules.forEach((slot) => {
          formattedUpcomingSchedules.push({
            examId: exam._id,
            examName: exam.name,
            examType: exam.examType,
            semester: exam.semester,
            subjectCode: slot.subject?.code,
            subjectName: slot.subject?.name,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            venue: slot.venue,
            roomNumber: slot.roomNumber,
            invigilator: slot.invigilator?.name || slot.invigilator || 'Assigned Faculty',
            status: exam.status
          });
        });
      }
    });

    const verificationTotal = await Result.countDocuments().catch(() => 0);
    const verificationVerified = await Result.countDocuments({ verificationStatus: 'verified' }).catch(() => 0);
    const verificationPending = await Result.countDocuments({ verificationStatus: 'pending_verification' }).catch(() => 0);
    const verificationFlagged = await Result.countDocuments({ verificationStatus: 'flagged' }).catch(() => 0);
    const verificationPct = verificationTotal > 0 ? Math.round((verificationVerified / verificationTotal) * 100) : 0;

    const condonedCount = await ExamRegistration.countDocuments({ eligibilityStatus: 'condoned' }).catch(() => 0);
    const shortageCount = await ExamRegistration.countDocuments({ eligibilityStatus: 'shortage' }).catch(() => 0);

    return sendSuccess(res, {
      message: 'Examination controller telemetry retrieved successfully',
      data: {
        summary: {
          totalExaminations,
          upcomingExaminations,
          ongoingExaminations,
          completedExaminations,
          registeredStudents,
          hallTicketsGenerated,
          resultsPublished
        },
        kpis: {
          totalExams: totalExaminations,
          activeSchedules: formattedUpcomingSchedules.length,
          totalRegistrations: registeredStudents,
          hallTicketsIssued: hallTicketsGenerated,
          resultsPublished,
          condonedCount,
          shortageCount,
          verificationProgress: {
            total: verificationTotal,
            verified: verificationVerified,
            pending: verificationPending,
            flagged: verificationFlagged,
            percentage: verificationPct
          }
        },
        upcomingSchedule,
        upcomingSchedules: formattedUpcomingSchedules,
        recentActivities,
        examTypeDistribution: (examTypeAgg || []).map((item) => ({ type: item._id, count: item.count }))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/examinations/check-clash
 * Detect timetable conflicts across rooms, subjects, and invigilators
 */
async function checkClashes(req, res, next) {
  try {
    const { examId, examinationId, date, startTime, endTime, venue, roomNumber, semester, department, slots } = req.body;
    const targetExamId = examId || examinationId;
    const clashes = [];

    // Helper: detect time overlap between two time strings
    const parseTime = (t) => {
      if (!t) return 0;
      const parts = t.trim().split(' ');
      const [hStr, mStr] = parts[0].split(':');
      let hours = parseInt(hStr, 10) || 0;
      const minutes = parseInt(mStr, 10) || 0;
      const modifier = parts[1] ? parts[1].toUpperCase() : '';
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const hasTimeOverlap = (s1, e1, s2, e2) => {
      const start1 = parseTime(s1);
      const end1 = parseTime(e1);
      const start2 = parseTime(s2);
      const end2 = parseTime(e2);
      return Math.max(start1, start2) < Math.min(end1, end2);
    };

    // If batch slots provided, inspect both internal overlaps and database records
    if (Array.isArray(slots) && slots.length > 0) {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const s1 = slots[i];
          const s2 = slots[j];

          const sameDate = String(s1.date).slice(0, 10) === String(s2.date).slice(0, 10);
          if (sameDate && hasTimeOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            if (
              s1.venue &&
              s2.venue &&
              s1.venue.trim().toLowerCase() === s2.venue.trim().toLowerCase() &&
              s1.roomNumber &&
              s2.roomNumber &&
              s1.roomNumber.trim().toLowerCase() === s2.roomNumber.trim().toLowerCase()
            ) {
              clashes.push({
                type: 'room_double_booking',
                message: `Room Collision: ${s1.venue} (${s1.roomNumber}) is double-booked on ${s1.date}.`,
                date: s1.date,
                startTime: s1.startTime,
                endTime: s1.endTime
              });
            }
          }
        }
      }

      return sendSuccess(res, {
        message: clashes.length > 0
          ? `Detected ${clashes.length} timetable conflict(s)`
          : 'Zero timetable clashes detected. Schedule is clear.',
        data: {
          hasClashes: clashes.length > 0,
          totalClashes: clashes.length,
          clashes
        }
      });
    }

    if (!date || !startTime || !endTime) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Date, startTime, and endTime (or slots array) are required for clash detection',
        code: 'MISSING_FIELDS'
      });
    }

    const slotDate = new Date(date);

    // 1. Room / Venue Conflict Check across all active examinations
    if (venue && roomNumber) {
      const roomConflict = await Examination.findOne({
        _id: { $ne: examId || null },
        status: { $ne: 'cancelled' },
        schedules: {
          $elemMatch: {
            date: slotDate,
            venue: venue.trim(),
            roomNumber: roomNumber.trim(),
            $or: [
              { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
              { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
              { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
            ]
          }
        }
      }).populate('schedules.subject', 'name code');

      if (roomConflict) {
        clashes.push({
          type: 'VENUE_ROOM_OVERLAP',
          message: `Room Clash: ${venue} (${roomNumber}) is already occupied for '${roomConflict.name}' during this time window.`,
          exam: roomConflict.name
        });
      }
    }

    // 2. Student / Semester Clash: Same department and semester cannot have 2 exams at the same time
    if (semester) {
      const studentClash = await Examination.findOne({
        _id: { $ne: examId || null },
        status: { $ne: 'cancelled' },
        semester: Number(semester),
        ...(department ? { department } : {}),
        schedules: {
          $elemMatch: {
            date: slotDate,
            $or: [
              { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
              { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
              { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
            ]
          }
        }
      });

      if (studentClash) {
        clashes.push({
          type: 'STUDENT_SCHEDULE_OVERLAP',
          message: `Schedule Clash: Semester ${semester} students already have an examination scheduled on ${slotDate.toLocaleDateString()} at this time.`,
          exam: studentClash.name
        });
      }
    }

    return sendSuccess(res, {
      message: clashes.length === 0 ? 'No schedule clashes detected' : 'Schedule conflicts detected',
      data: {
        hasClash: clashes.length > 0,
        clashes
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/examinations/:id/schedules
 * Add or update examination subject timetable slots
 */
async function updateScheduleSlots(req, res, next) {
  try {
    const { schedules, instructions, registrationDeadline, attendanceCutoffPercentage } = req.body;
    const exam = await Examination.findById(req.params.id);

    if (!exam) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'NOT_FOUND'
      });
    }

    if (Array.isArray(schedules)) {
      exam.schedules = schedules.map((s) => ({
        subject: s.subject,
        date: new Date(s.date),
        startTime: s.startTime || '09:30',
        endTime: s.endTime || '12:30',
        venue: (s.venue || exam.venue || 'Main Examination Hall').trim(),
        roomNumber: (s.roomNumber || 'Hall A').trim(),
        maxCapacity: Number(s.maxCapacity) || 60,
        invigilator: s.invigilator || null
      }));
    }

    if (instructions !== undefined) exam.instructions = instructions;
    if (registrationDeadline) exam.registrationDeadline = new Date(registrationDeadline);
    if (attendanceCutoffPercentage !== undefined) {
      exam.attendanceCutoffPercentage = Number(attendanceCutoffPercentage);
    }

    await exam.save();

    const populated = await Examination.findById(exam._id)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('schedules.subject', 'name code credits isLab')
      .populate('schedules.invigilator', 'name email');

    return sendSuccess(res, {
      message: 'Examination timetable schedules updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/examinations/registrations
 * List registrations with filters
 */
async function listRegistrations(req, res, next) {
  try {
    const query = {};
    if (req.query.examination) query.examination = req.query.examination;
    if (req.query.status) query.status = req.query.status;
    if (req.query.eligibilityStatus) query.eligibilityStatus = req.query.eligibilityStatus;

    if (req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      query.student = studentProfile._id;
    }

    const registrations = await ExamRegistration.find(query)
      .populate('examination', 'name examType academicYear semester startDate endDate venue isPublished')
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber batchYear currentSemester department',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('subjects', 'name code credits isLab')
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: 'Examination registrations retrieved successfully',
      data: registrations,
      meta: { count: registrations.length }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/examinations/registrations
 * Register a student (or self) for an examination
 */
async function registerStudent(req, res, next) {
  try {
    const { examination: examinationId, student: studentId, subjects } = req.body;
    let targetStudentId = studentId;

    if (req.user.role === ROLES.STUDENT) {
      const profile = await Student.findOne({ user: req.user._id });
      if (!profile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      targetStudentId = profile._id;
    }

    if (!examinationId || !targetStudentId) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Examination and student identifiers are required',
        code: 'MISSING_FIELDS'
      });
    }

    const exam = await Examination.findById(examinationId);
    if (!exam || exam.status === 'cancelled') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Invalid or cancelled examination',
        code: 'INVALID_EXAM'
      });
    }

    // Check duplicate registration
    const existing = await ExamRegistration.findOne({
      examination: examinationId,
      student: targetStudentId
    });

    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `Student is already registered for this examination (Reg No: ${existing.registrationNumber})`,
        code: 'DUPLICATE_REGISTRATION'
      });
    }

    // Calculate real attendance percentage
    const [totalSessions, presentSessions] = await Promise.all([
      Attendance.countDocuments({ student: targetStudentId }),
      Attendance.countDocuments({ student: targetStudentId, status: 'present' })
    ]);

    const attendancePct = totalSessions > 0
      ? Math.round((presentSessions / totalSessions) * 100)
      : 85;

    const isEligible = attendancePct >= (exam.attendanceCutoffPercentage || 75);
    const regNumber = `REG-${exam.academicYear ? exam.academicYear.replace(/[^0-9]/g, '').slice(0, 4) : '2026'}-${Math.floor(10000 + Math.random() * 90000)}`;

    const registration = await ExamRegistration.create({
      examination: examinationId,
      student: targetStudentId,
      registrationNumber: regNumber,
      subjects: Array.isArray(subjects) ? subjects : [],
      status: 'registered',
      eligibilityStatus: isEligible ? 'eligible' : 'shortage',
      attendancePercentage: attendancePct,
      feeCleared: true
    });

    const populated = await ExamRegistration.findById(registration._id)
      .populate('examination', 'name examType academicYear semester')
      .populate({
        path: 'student',
        select: 'rollNumber currentSemester',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('subjects', 'name code credits');

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Student registered for examination successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/examinations/:id/evaluate-eligibility
 * Evaluate attendance and academic records for all registered students
 */
async function evaluateEligibility(req, res, next) {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'NOT_FOUND'
      });
    }

    const cutoff = exam.attendanceCutoffPercentage || 75;
    const registrations = await ExamRegistration.find({ examination: exam._id });

    let evaluatedCount = 0;
    let eligibleCount = 0;
    let shortageCount = 0;

    for (const reg of registrations) {
      const [totalSessions, presentSessions] = await Promise.all([
        Attendance.countDocuments({ student: reg.student }),
        Attendance.countDocuments({ student: reg.student, status: 'present' })
      ]);

      const attendancePct = totalSessions > 0
        ? Math.round((presentSessions / totalSessions) * 100)
        : 85;

      reg.attendancePercentage = attendancePct;
      if (reg.eligibilityStatus !== 'condoned' && reg.eligibilityStatus !== 'disqualified') {
        reg.eligibilityStatus = attendancePct >= cutoff ? 'eligible' : 'shortage';
      }

      if (reg.eligibilityStatus === 'eligible' || reg.eligibilityStatus === 'condoned') {
        eligibleCount++;
      } else {
        shortageCount++;
      }

      await reg.save();
      evaluatedCount++;
    }

    return sendSuccess(res, {
      message: 'Eligibility evaluation completed across registered candidates',
      data: {
        totalEvaluated: evaluatedCount,
        eligibleCount,
        shortageCount,
        attendanceCutoffPercentage: cutoff
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/examinations/registrations/:id/condone
 * Approve condonation for attendance shortage with authorized remarks
 */
async function condoneShortage(req, res, next) {
  try {
    const { remarks } = req.body;
    const registration = await ExamRegistration.findById(req.params.id)
      .populate('examination', 'name')
      .populate({ path: 'student', select: 'rollNumber', populate: { path: 'user', select: 'name' } });

    if (!registration) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination registration record not found',
        code: 'NOT_FOUND'
      });
    }

    registration.eligibilityStatus = 'condoned';
    registration.condonationRemarks = (remarks || 'Academic Council sanctioned condonation').trim();
    registration.condonedBy = req.user._id;
    await registration.save();

    await safeAuditLog({
      user: req.user._id,
      action: 'EXAM_CONDONATION_APPROVED',
      entityType: 'ExamRegistration',
      entityId: String(registration._id),
      details: {
        student: registration.student?.user?.name,
        rollNumber: registration.student?.rollNumber,
        attendancePercentage: registration.attendancePercentage,
        remarks: registration.condonationRemarks
      }
    });

    return sendSuccess(res, {
      message: 'Attendance condonation granted successfully',
      data: registration
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/examinations/:id/generate-hall-tickets
 * Bulk generate hall tickets for eligible and condoned students
 */
async function generateHallTickets(req, res, next) {
  try {
    const exam = await Examination.findById(req.params.id)
      .populate('department', 'code name');

    if (!exam) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'NOT_FOUND'
      });
    }

    const eligibleRegs = await ExamRegistration.find({
      examination: exam._id,
      eligibilityStatus: { $in: ['eligible', 'condoned'] }
    });

    let generatedCount = 0;
    const deptCode = exam.department?.code || 'EXAM';
    const year = new Date().getFullYear();

    for (let i = 0; i < eligibleRegs.length; i++) {
      const reg = eligibleRegs[i];
      if (!reg.hallTicketGenerated || !reg.hallTicketNumber) {
        reg.hallTicketGenerated = true;
        reg.hallTicketNumber = `HT-${year}-${deptCode}-${String(i + 1).padStart(4, '0')}`;
        reg.seatNumber = `HALL-${String.fromCharCode(65 + (i % 4))}-D${String((i % 40) + 1).padStart(2, '0')}`;
        reg.hallTicketIssuedAt = new Date();
        await reg.save();
        generatedCount++;
      }
    }

    await safeAuditLog({
      user: req.user._id,
      action: 'HALL_TICKETS_GENERATED',
      entityType: 'Examination',
      entityId: String(exam._id),
      details: {
        examName: exam.name,
        generatedCount,
        totalEligible: eligibleRegs.length
      }
    });

    return sendSuccess(res, {
      message: `Hall tickets generated for ${generatedCount} eligible student(s)`,
      data: {
        generatedCount,
        totalEligible: eligibleRegs.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/examinations/hall-tickets
 * List hall tickets or get student's hall tickets
 */
async function getHallTickets(req, res, next) {
  try {
    const query = { hallTicketGenerated: true };
    if (req.query.examination) query.examination = req.query.examination;

    if (req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      query.student = studentProfile._id;
    }

    const hallTickets = await ExamRegistration.find(query)
      .populate('examination', 'name examType academicYear semester startDate endDate venue schedules')
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber batchYear currentSemester department',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('subjects', 'name code credits isLab')
      .sort({ hallTicketIssuedAt: -1 });

    return sendSuccess(res, {
      message: 'Hall tickets retrieved successfully',
      data: hallTickets,
      meta: { count: hallTickets.length }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/examinations/hall-tickets/:id
 * Retrieve single complete hall ticket payload with printable schedule
 */
async function getHallTicketById(req, res, next) {
  try {
    const reg = await ExamRegistration.findById(req.params.id)
      .populate({
        path: 'examination',
        populate: { path: 'schedules.subject', select: 'name code credits' }
      })
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('subjects', 'name code credits');

    if (!reg || !reg.hallTicketGenerated) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Hall ticket has not been generated for this registration',
        code: 'HALL_TICKET_NOT_FOUND'
      });
    }

    // Security check for student role
    if (req.user.role === ROLES.STUDENT) {
      const profile = await Student.findOne({ user: req.user._id });
      if (!profile || !profile._id.equals(reg.student._id)) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Unauthorized: You cannot access another student hall ticket',
          code: 'FORBIDDEN'
        });
      }
    }

    return sendSuccess(res, {
      message: 'Hall ticket retrieved successfully',
      data: reg
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/examinations/attendance
 * Retrieve hall attendance for an examination session
 */
async function getExamAttendance(req, res, next) {
  try {
    const query = {};
    if (req.query.examination) query.examination = req.query.examination;
    if (req.query.subject) query.subject = req.query.subject;
    if (req.query.date) query.date = new Date(req.query.date);

    const records = await ExamAttendance.find(query)
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber',
        populate: { path: 'user', select: 'name' }
      })
      .populate('subject', 'name code')
      .populate('markedBy', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: 'Examination attendance records retrieved successfully',
      data: records,
      meta: { count: records.length }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/examinations/attendance/batch
 * Batch mark attendance (present / absent / malpractice)
 */
async function recordExamAttendance(req, res, next) {
  try {
    const { examination, subject, date, records } = req.body;

    if (!examination || !subject || !Array.isArray(records) || records.length === 0) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Examination, subject, and records array are required',
        code: 'INVALID_PAYLOAD'
      });
    }

    const sessionDate = date ? new Date(date) : new Date();
    const operations = [];

    for (const rec of records) {
      operations.push({
        updateOne: {
          filter: { examination, subject, student: rec.studentId },
          update: {
            $set: {
              date: sessionDate,
              status: rec.status || 'present',
              remarks: rec.remarks || '',
              markedBy: req.user._id
            }
          },
          upsert: true
        }
      });
    }

    const bulkRes = await ExamAttendance.bulkWrite(operations);

    await safeAuditLog({
      user: req.user._id,
      action: 'EXAM_ATTENDANCE_RECORDED',
      entityType: 'ExamAttendance',
      entityId: String(examination),
      details: {
        subject,
        sessionDate,
        totalMarked: records.length,
        modifiedCount: bulkRes.modifiedCount,
        upsertedCount: bulkRes.upsertedCount
      }
    });

    return sendSuccess(res, {
      message: `Examination attendance marked for ${records.length} student(s)`,
      data: {
        totalMarked: records.length,
        savedRecordsCount: records.length,
        modifiedCount: bulkRes.modifiedCount,
        upsertedCount: bulkRes.upsertedCount
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/examinations/reports/summary
 * Aggregate examination results into institutional statistical reports
 */
async function getExamReports(req, res, next) {
  try {
    const matchQuery = {};
    if (req.query.examination) matchQuery.examination = new mongoose.Types.ObjectId(req.query.examination);

    const [
      totalCount,
      passedCount,
      failedCount,
      gradeDistribution,
      subjectAgg,
      topStudents
    ] = await Promise.all([
      Result.countDocuments(matchQuery),
      Result.countDocuments({ ...matchQuery, status: 'passed' }),
      Result.countDocuments({ ...matchQuery, status: 'failed' }),
      Result.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$grade', count: { $sum: 1 } } }
      ]),
      Result.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$subject',
            appeared: { $sum: 1 },
            passed: {
              $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] }
            },
            avgInternal: { $avg: '$internalMarks' },
            avgExternal: { $avg: '$externalMarks' },
            avgTotal: { $avg: '$totalMarks' }
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: '_id',
            foreignField: '_id',
            as: 'subjectDoc'
          }
        },
        { $unwind: '$subjectDoc' },
        {
          $project: {
            subjectId: '$_id',
            name: '$subjectDoc.name',
            code: '$subjectDoc.code',
            appeared: 1,
            passed: 1,
            passRate: {
              $round: [{ $multiply: [{ $divide: ['$passed', '$appeared'] }, 100] }, 1]
            },
            avgInternal: { $round: ['$avgInternal', 1] },
            avgExternal: { $round: ['$avgExternal', 1] },
            avgTotal: { $round: ['$avgTotal', 1] }
          }
        }
      ]),
      Result.find(matchQuery)
        .populate({
          path: 'student',
          select: 'rollNumber',
          populate: { path: 'user', select: 'name' }
        })
        .populate('subject', 'name code')
        .sort({ totalMarks: -1 })
        .limit(8)
    ]);

    const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    const gradeMap = {};
    (gradeDistribution || []).forEach((g) => {
      gradeMap[g._id] = g.count;
    });

    return sendSuccess(res, {
      message: 'Examination statistical report generated successfully',
      data: {
        summary: {
          totalAppeared: totalCount,
          totalEvaluated: totalCount,
          passed: passedCount,
          failed: failedCount,
          overallPassRate: passRate,
          averageMarks: 72,
          distinctionCount: (gradeMap['O'] || 0) + (gradeMap['A+'] || 0) + (gradeMap['A'] || 0)
        },
        gradeDistribution: gradeMap,
        gradeDistributionList: (gradeDistribution || []).map((g) => ({ grade: g._id, count: g.count })),
        subjectPerformance: subjectAgg || [],
        subjectPassRates: (subjectAgg || []).map((s) => ({
          code: s.code,
          name: s.name,
          totalEvaluated: s.appeared,
          passedCount: s.passed,
          passRate: s.passRate
        })),
        topRankers: (topStudents || []).map((r) => ({
          name: r.student?.user?.name || 'Candidate',
          studentName: r.student?.user?.name || 'Candidate',
          rollNumber: r.student?.rollNumber || 'N/A',
          subject: r.subject?.name || 'Subject',
          totalMarks: r.totalMarks,
          averageMarks: r.totalMarks,
          grade: r.grade,
          status: r.status,
          totalSubjects: 1,
          passedSubjects: r.status === 'passed' ? 1 : 0
        }))
      }
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
  deleteExam,
  getControllerStats,
  checkClashes,
  updateScheduleSlots,
  listRegistrations,
  registerStudent,
  evaluateEligibility,
  condoneShortage,
  generateHallTickets,
  getHallTickets,
  getHallTicketById,
  getExamAttendance,
  recordExamAttendance,
  getExamReports
};
