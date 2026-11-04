const Attendance = require('./attendance.model');
const Student = require('../students/student.model');
const Department = require('../departments/department.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { resolveHodDepartment, isHodDepartment } = require('../../utils/hodScoping');

async function getAttendanceRecords(req, res, next) {
  try {
    const query = {};
    if (req.query.student) query.student = req.query.student;
    if (req.query.subject) query.subject = req.query.subject;
    if (req.query.date) query.date = new Date(req.query.date);

    // If student role, restrict query to self
    if (req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked to user account',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      query.student = studentProfile._id;
    } else if (req.user && req.user.role === ROLES.HOD && !req.query.student) {
      let hodDept = null;
      if (req.user.department) {
        hodDept = await Department.findOne({
          $or: [{ name: req.user.department }, { hod: req.user._id }]
        });
      } else {
        hodDept = await Department.findOne({ hod: req.user._id });
      }

      if (hodDept) {
        const deptStudents = await Student.find({ department: hodDept._id }).select('_id');
        const deptStudentIds = deptStudents.map((s) => s._id);
        query.student = { $in: deptStudentIds };
      }
    }

    const records = await Attendance.find(query)
      .populate('student', 'rollNumber')
      .populate('subject', 'name code')
      .limit(100)
      .sort({ date: -1 });

    return sendSuccess(res, {
      message: 'Attendance records fetched successfully',
      data: records,
      meta: { count: records.length }
    });
  } catch (error) {
    next(error);
  }
}

async function markAttendanceBatch(req, res, next) {
  try {
    const { subject, date, periodNumber = 1, records } = req.body;

    const operations = records.map((rec) => ({
      updateOne: {
        filter: {
          student: rec.studentId,
          subject,
          date: new Date(date),
          periodNumber
        },
        update: {
          $set: {
            status: rec.status,
            remarks: rec.remarks || '',
            faculty: req.user._id
          }
        },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(operations);

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Attendance recorded successfully',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAttendanceSummary(req, res, next) {
  try {
    let studentId = req.query.studentId || req.query.student;
    let departmentId = req.query.departmentId || req.query.department;

    if (req.user.role === ROLES.STUDENT) {
      const profile = await Student.findOne({ user: req.user._id });
      if (!profile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not found',
          code: 'NOT_FOUND'
        });
      }
      studentId = profile._id;
      departmentId = null; // Prevent student from viewing departmental aggregates
    }

    let query = {};
    let totalDepartmentStudents = 0;

    if (departmentId) {
      const deptStudents = await Student.find({ department: departmentId }).select('_id');
      totalDepartmentStudents = deptStudents.length;
      const studentIds = deptStudents.map((s) => s._id);
      query.student = { $in: studentIds };
    } else if (studentId) {
      query.student = studentId;
    }

    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    const records = await Attendance.find(query);
    const totalClasses = records.length;
    const presentClasses = records.filter((r) => r.status === 'present').length;
    const absentClasses = records.filter((r) => r.status === 'absent').length;
    const percentage = totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : 0;

    return sendSuccess(res, {
      message: 'Attendance summary calculated',
      data: {
        totalClasses,
        presentClasses,
        absentClasses,
        percentage,
        totalDepartmentStudents,
        hasRecords: totalClasses > 0,
        statusAlert: totalClasses === 0 ? 'No attendance records yet' : percentage < 75 ? 'Low Attendance (<75%)' : 'Good Standing (≥75%)'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendanceRecords,
  markAttendanceBatch,
  getAttendanceSummary,
  getAttendanceIntelligence
};

/**
 * GET /api/v1/attendance/intelligence
 * Phase 3 Attendance Intelligence: 75% statutory recovery target, consecutive absence detection & edge-case validation
 */
async function getAttendanceIntelligence(req, res, next) {
  try {
    const query = {};

    // Strict role scoping
    if (req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked to user account',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      query.student = studentProfile._id;
    } else if (req.user.role === ROLES.PARENT) {
      if (req.user.studentId) {
        query.student = req.user.studentId;
      } else {
        const student = await Student.findOne({
          $or: [{ parentEmail: req.user.email }, { parentPhone: req.user.phone }]
        });
        if (student) {
          query.student = student._id;
        } else {
          return sendSuccess(res, {
            message: 'No student linked to parent profile',
            data: { shortageAlerts: [], students: [] }
          });
        }
      }
    } else if (req.user.role === ROLES.HOD) {
      let hodDept = null;
      if (req.user.department) {
        hodDept = await Department.findOne({
          $or: [{ name: req.user.department }, { hod: req.user._id }]
        });
      } else {
        hodDept = await Department.findOne({ hod: req.user._id });
      }
      if (hodDept) {
        const deptStudents = await Student.find({ department: hodDept._id }).select('_id');
        query.student = { $in: deptStudents.map((s) => s._id) };
      }
    } else if (req.query.student) {
      if (mongoose.Types.ObjectId.isValid(req.query.student)) {
        query.student = req.query.student;
      }
    }

    if (req.query.subject && mongoose.Types.ObjectId.isValid(req.query.subject)) {
      query.subject = req.query.subject;
    }

    // Group attendance records by student
    const studentIds = query.student?.$in
      ? query.student.$in
      : query.student
      ? [query.student]
      : await Student.find(query.department ? { department: query.department } : {}).limit(100).distinct('_id');

    const students = await Student.find({ _id: { $in: studentIds } })
      .populate('user', 'name email')
      .populate('department', 'name code');

    const analyses = await Promise.all(
      students.map(async (student) => {
        const studentRecords = await Attendance.find({ student: student._id })
          .sort({ date: -1 })
          .populate('subject', 'name code');

        const totalConducted = studentRecords.length;
        const totalAttended = studentRecords.filter((r) => r.status === 'present').length;
        const totalAbsent = studentRecords.filter((r) => r.status === 'absent').length;

        // 1. Percentage & Shortage (Edge-case: 0 total classes)
        const currentPercentage = totalConducted > 0
          ? Number(((totalAttended / totalConducted) * 100).toFixed(1))
          : 0;

        const isShortage = totalConducted > 0 && currentPercentage < 75.0;

        // 2. Classes Required to Recover to 75%
        // Formula: (A + x) / (T + x) >= 0.75  ==> x >= 3*T - 4*A
        let classesRequiredFor75 = 0;
        let classesCanAffordToMiss = 0;

        if (totalConducted > 0) {
          if (currentPercentage < 75.0) {
            classesRequiredFor75 = Math.max(0, Math.ceil(3 * totalConducted - 4 * totalAttended));
          } else {
            // How many classes can student miss while maintaining >= 75%?
            // Formula: A / (T + y) >= 0.75 ==> y <= (A - 0.75*T) / 0.75
            classesCanAffordToMiss = Math.max(0, Math.floor((totalAttended - 0.75 * totalConducted) / 0.75));
          }
        }

        // 3. Consecutive Absence Pattern Detection
        let consecutiveAbsences = 0;
        for (const record of studentRecords) {
          if (record.status === 'absent') {
            consecutiveAbsences++;
          } else {
            break;
          }
        }
        const hasConsecutiveAbsenceWarning = consecutiveAbsences >= 3;

        return {
          studentId: student._id,
          rollNumber: student.rollNumber,
          name: student.user?.name || 'Student',
          email: student.user?.email,
          department: student.department?.name,
          currentSemester: student.currentSemester,
          attendance: {
            totalConducted,
            totalAttended,
            totalAbsent,
            currentPercentage,
            statutoryThreshold: 75.0,
            isShortage,
            classesRequiredFor75,
            classesCanAffordToMiss,
            consecutiveAbsences,
            hasConsecutiveAbsenceWarning,
            standingStatus: totalConducted === 0
              ? 'No attendance records yet'
              : isShortage
              ? 'Critical Shortage (<75%)'
              : currentPercentage >= 90
              ? 'Excellent (≥90%)'
              : 'Good Standing (75-89%)'
          }
        };
      })
    );

    const shortageList = analyses.filter((a) => a.attendance.isShortage);
    const consecutiveWarningList = analyses.filter((a) => a.attendance.hasConsecutiveAbsenceWarning);

    return sendSuccess(res, {
      message: 'Attendance intelligence and recovery analytics generated',
      data: {
        timestamp: new Date().toISOString(),
        summary: {
          totalAnalyzed: analyses.length,
          studentsWithShortage: shortageList.length,
          studentsWithConsecutiveAbsenceAlerts: consecutiveWarningList.length,
          overallHealthyCount: analyses.length - shortageList.length
        },
        students: analyses,
        shortageAlerts: shortageList
      }
    });
  } catch (error) {
    next(error);
  }
}

