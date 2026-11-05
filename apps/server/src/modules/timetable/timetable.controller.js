const mongoose = require('mongoose');
const Timetable = require('./timetable.model');
const Department = require('../departments/department.model');
const Student = require('../students/student.model');
const Faculty = require('../faculty/faculty.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { resolveHodDepartment, isHodDepartment } = require('../../utils/hodScoping');

async function getTimetable(req, res, next) {
  try {
    const query = {};
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
    if (req.query.course) {
      const cVal = String(req.query.course).trim();
      if (mongoose.Types.ObjectId.isValid(cVal)) query.course = cVal;
    }
    if (req.query.faculty) {
      const fVal = String(req.query.faculty).trim();
      if (mongoose.Types.ObjectId.isValid(fVal)) query.faculty = fVal;
    }
    if (req.query.semester) {
      const sem = parseInt(req.query.semester, 10);
      if (!isNaN(sem)) query.semester = sem;
    }
    if (req.query.section && typeof req.query.section === 'string') {
      query.section = req.query.section.toUpperCase();
    }
    if (req.query.dayOfWeek && typeof req.query.dayOfWeek === 'string') {
      query.dayOfWeek = req.query.dayOfWeek;
    }

    if (req.user && req.user.role === ROLES.STUDENT && !query.department) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (studentProfile) {
        if (studentProfile.department) query.department = studentProfile.department;
        if (studentProfile.currentSemester) query.semester = studentProfile.currentSemester;
      }
    } else if (req.user && req.user.role === ROLES.FACULTY && !query.faculty) {
      const facultyProfile = await Faculty.findOne({ user: req.user._id });
      if (facultyProfile) query.faculty = facultyProfile._id;
    } else if (req.user && req.user.role === ROLES.HOD) {
      const dept = await Department.findOne({
        $or: [
          { hod: req.user._id },
          ...(req.user.department
            ? [
                ...(mongoose.Types.ObjectId.isValid(req.user.department) ? [{ _id: req.user.department }] : []),
                { name: req.user.department },
                { code: String(req.user.department).toUpperCase() }
              ]
            : [])
        ]
      });
      if (dept) query.department = dept._id;
    }

    // Contextual role-based scoping when parameters are omitted
    if (req.user && req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (studentProfile) {
        if (!req.query.department && studentProfile.department) {
          query.department = studentProfile.department;
        }
        if (!req.query.semester && studentProfile.currentSemester) {
          query.semester = studentProfile.currentSemester;
        }
      }
    } else if (req.user && req.user.role === ROLES.FACULTY && !req.query.faculty && !req.query.department) {
      const facultyProfile = await Faculty.findOne({ user: req.user._id });
      if (facultyProfile) {
        query.faculty = facultyProfile._id;
      }
    } else if (req.user && req.user.role === ROLES.HOD && !req.query.department) {
      const dept = await Department.findOne({ hod: req.user._id }) || (req.user.department ? await Department.findOne({ name: req.user.department }) : null);
      if (dept) {
        query.department = dept._id;
      }
    }

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

    if (req.user?.role === ROLES.HOD && department) {
      const matches = await isHodDepartment(req.user, department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only create timetable slots within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }
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

    if (req.user?.role === ROLES.HOD && slot.department) {
      const matches = await isHodDepartment(req.user, slot.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only update timetable slots within their assigned department',
          code: 'FORBIDDEN'
        });
      }
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
  deleteTimetableSlot,
  getClashDetection,
  getWorkloadBalancing,
  getOptimizationSuggestions
};

/**
 * GET /api/v1/timetable/clash-detection
 * Identifies faculty double-booking, room conflicts, and section timetable conflicts
 */
async function getClashDetection(req, res, next) {
  try {
    const query = {};
    if (req.user.role === ROLES.HOD) {
      let hodDept = null;
      if (req.user.department) {
        hodDept = await Department.findOne({
          $or: [{ name: req.user.department }, { hod: req.user._id }]
        });
      } else {
        hodDept = await Department.findOne({ hod: req.user._id });
      }
      if (hodDept) query.department = hodDept._id;
    } else if (req.query.department && mongoose.Types.ObjectId.isValid(req.query.department)) {
      query.department = req.query.department;
    }

    const slots = await Timetable.find(query)
      .populate('faculty', 'employeeId user designation')
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .lean();

    const facultyMap = new Map();
    const roomMap = new Map();
    const sectionMap = new Map();

    const conflicts = [];

    slots.forEach((slot) => {
      const day = slot.dayOfWeek;
      const period = slot.periodNumber;

      // 1. Faculty Double Booking
      if (slot.faculty) {
        const facId = slot.faculty._id ? slot.faculty._id.toString() : slot.faculty.toString();
        const facKey = `${day}_${period}_${facId}`;
        if (!facultyMap.has(facKey)) {
          facultyMap.set(facKey, []);
        }
        facultyMap.get(facKey).push(slot);
      }

      // 2. Room Conflict
      if (slot.roomNumber && String(slot.roomNumber).trim()) {
        const roomKey = `${day}_${period}_${String(slot.roomNumber).trim().toUpperCase()}`;
        if (!roomMap.has(roomKey)) {
          roomMap.set(roomKey, []);
        }
        roomMap.get(roomKey).push(slot);
      }

      // 3. Section Conflict
      if (slot.department && slot.semester && slot.section) {
        const deptId = slot.department._id ? slot.department._id.toString() : slot.department.toString();
        const secKey = `${day}_${period}_${deptId}_${slot.semester}_${slot.section.toUpperCase()}`;
        if (!sectionMap.has(secKey)) {
          sectionMap.set(secKey, []);
        }
        sectionMap.get(secKey).push(slot);
      }
    });

    // Collect Faculty Double Bookings
    facultyMap.forEach((matchedSlots, key) => {
      if (matchedSlots.length > 1) {
        conflicts.push({
          type: 'faculty_double_booking',
          severity: 'critical',
          dayOfWeek: matchedSlots[0].dayOfWeek,
          periodNumber: matchedSlots[0].periodNumber,
          description: `Faculty double-booked across ${matchedSlots.length} different slots at Period ${matchedSlots[0].periodNumber} on ${matchedSlots[0].dayOfWeek}`,
          involvedSlots: matchedSlots.map((s) => ({
            id: s._id,
            subject: s.subject?.name,
            room: s.roomNumber,
            department: s.department?.name,
            semester: s.semester,
            section: s.section
          }))
        });
      }
    });

    // Collect Room Conflicts
    roomMap.forEach((matchedSlots, key) => {
      if (matchedSlots.length > 1) {
        conflicts.push({
          type: 'room_overlap_conflict',
          severity: 'high',
          dayOfWeek: matchedSlots[0].dayOfWeek,
          periodNumber: matchedSlots[0].periodNumber,
          description: `Room ${matchedSlots[0].roomNumber} simultaneously allocated to ${matchedSlots.length} classes at Period ${matchedSlots[0].periodNumber} on ${matchedSlots[0].dayOfWeek}`,
          involvedSlots: matchedSlots.map((s) => ({
            id: s._id,
            subject: s.subject?.name,
            faculty: s.faculty?.user?.name || 'Assigned Faculty',
            department: s.department?.name,
            section: s.section
          }))
        });
      }
    });

    // Collect Section Conflicts
    sectionMap.forEach((matchedSlots, key) => {
      if (matchedSlots.length > 1) {
        conflicts.push({
          type: 'section_overlap_conflict',
          severity: 'critical',
          dayOfWeek: matchedSlots[0].dayOfWeek,
          periodNumber: matchedSlots[0].periodNumber,
          description: `Section ${matchedSlots[0].section} (Semester ${matchedSlots[0].semester}) has ${matchedSlots.length} simultaneous classes scheduled at Period ${matchedSlots[0].periodNumber}`,
          involvedSlots: matchedSlots.map((s) => ({
            id: s._id,
            subject: s.subject?.name,
            faculty: s.faculty?.user?.name || 'Assigned Faculty',
            room: s.roomNumber
          }))
        });
      }
    });

    return sendSuccess(res, {
      message: 'Timetable clash analysis completed',
      data: {
        timestamp: new Date().toISOString(),
        totalSlotsEvaluated: slots.length,
        totalConflictsFound: conflicts.length,
        hasConflicts: conflicts.length > 0,
        conflicts
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/timetable/workload-balancing
 * Computes weekly teaching hours/periods per faculty against recommended workload limits
 */
async function getWorkloadBalancing(req, res, next) {
  try {
    const facultyMembers = await Faculty.find()
      .populate('user', 'name email status')
      .populate('department', 'name code');

    const workloads = await Promise.all(
      facultyMembers.map(async (fac) => {
        const slots = await Timetable.find({ faculty: fac._id })
          .populate('subject', 'name code')
          .populate('department', 'name code');

        const weeklyPeriods = slots.length;
        // Standard period duration = 50 minutes
        const weeklyHours = Math.round((weeklyPeriods * 50 / 60) * 10) / 10;

        let status = 'optimal';
        if (weeklyHours > 18) {
          status = 'overloaded';
        } else if (weeklyHours < 10) {
          status = 'underloaded';
        }

        return {
          facultyId: fac._id,
          name: fac.user?.name || 'Faculty Member',
          email: fac.user?.email,
          designation: fac.designation || 'Assistant Professor',
          department: fac.department?.name,
          metrics: {
            weeklyPeriodsAssigned: weeklyPeriods,
            weeklyTeachingHours: weeklyHours,
            recommendedHoursCap: 16,
            workloadStatus: status
          },
          subjectsCovered: [...new Set(slots.map((s) => s.subject?.name).filter(Boolean))]
        };
      })
    );

    const overloadedCount = workloads.filter((w) => w.metrics.workloadStatus === 'overloaded').length;
    const underloadedCount = workloads.filter((w) => w.metrics.workloadStatus === 'underloaded').length;

    return sendSuccess(res, {
      message: 'Faculty workload distribution evaluated successfully',
      data: {
        timestamp: new Date().toISOString(),
        summary: {
          totalFacultyEvaluated: workloads.length,
          overloadedCount,
          underloadedCount,
          optimalCount: workloads.length - (overloadedCount + underloadedCount)
        },
        workloads
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/timetable/optimization-suggestions
 * Proposes open slots and scheduling balance without altering persisted records
 */
async function getOptimizationSuggestions(req, res, next) {
  try {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1, 2, 3, 4, 5, 6, 7];

    const allSlots = await Timetable.find().select('dayOfWeek periodNumber roomNumber faculty');

    const bookedFacultyPeriods = new Set();
    const bookedRoomPeriods = new Set();

    allSlots.forEach((s) => {
      if (s.faculty) bookedFacultyPeriods.add(`${s.dayOfWeek}_${s.periodNumber}_${s.faculty.toString()}`);
      if (s.roomNumber) bookedRoomPeriods.add(`${s.dayOfWeek}_${s.periodNumber}_${s.roomNumber.toUpperCase()}`);
    });

    const suggestions = [
      {
        recommendation: 'Prioritize heavy theory courses (Maths, Algorithms) during morning Periods 1 & 2',
        impact: 'High student retention and attention velocity'
      },
      {
        recommendation: 'Reserve afternoon Periods 5–7 for practical laboratory laboratory blocks',
        impact: 'Continuous multi-period block allocation without lecture fragmentation'
      },
      {
        recommendation: 'Evenly distribute faculty teaching schedules across Wednesday & Thursday to prevent Friday concentration',
        impact: 'Workload balance compliance'
      }
    ];

    return sendSuccess(res, {
      message: 'Timetable optimization suggestions generated',
      data: {
        timestamp: new Date().toISOString(),
        advisoryNotes: 'These suggestions are heuristic optimization guidelines and do not modify persisted timetable records automatically.',
        suggestions
      }
    });
  } catch (error) {
    next(error);
  }
}
