const Student = require('./student.model');
const Department = require('../departments/department.model');
const User = require('../auth/auth.model');
const Attendance = require('../attendance/attendance.model');
const Result = require('../results/result.model');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');
const { resolveHodDepartment, isHodDepartment } = require('../../utils/hodScoping');

async function listStudents(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user?.role === ROLES.HOD) {
      const hodDept = await resolveHodDepartment(req.user);
      if (hodDept) {
        if (req.query.department) {
          const deptVal = String(req.query.department).trim();
          const matches = await isHodDepartment(req.user, deptVal);
          if (!matches) {
            return sendError(res, {
              statusCode: HTTP_STATUS.FORBIDDEN,
              message: 'Forbidden: HOD can only view students within their assigned department',
              code: 'FORBIDDEN'
            });
          }
        }
        query.department = hodDept._id;
      }
    } else if (req.query.department) {
      const deptVal = String(req.query.department).trim();
      if (deptVal === '[object Object]' || deptVal === 'undefined' || deptVal === 'null') {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: 'Invalid department identifier supplied',
          code: 'INVALID_DEPARTMENT'
        });
      }
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
            message: `Department '${deptVal}' not found or invalid format`,
            code: 'INVALID_DEPARTMENT'
          });
        }
      }
    }
    if (req.query.semester) query.currentSemester = parseInt(req.query.semester, 10);
    if (req.query.batch) query.batchYear = req.query.batch;
    if (req.query.status) query.admissionStatus = req.query.status;

    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ rollNumber: regex }, { enrollmentNumber: regex }];
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('user', 'name email status lastLogin')
        .populate('department', 'name code')
        .populate('course', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ rollNumber: 1 }),
      Student.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Students retrieved successfully',
      data: students,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentById(req, res, next) {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email status lastLogin')
      .populate('department', 'name code')
      .populate('course', 'name code');

    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Student record not found',
        code: 'NOT_FOUND'
      });
    }

    if (req.user?.role === ROLES.HOD && student.department) {
      const matches = await isHodDepartment(req.user, student.department._id || student.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only view student details within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }

    return sendSuccess(res, { data: student });
  } catch (error) {
    next(error);
  }
}

async function getMyStudentProfile(req, res, next) {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name email status lastLogin')
      .populate('department', 'name code')
      .populate('course', 'name code');

    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'No student profile associated with this account',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: student });
  } catch (error) {
    next(error);
  }
}

async function createStudentProfile(req, res, next) {
  try {
    const { user, rollNumber, enrollmentNumber, department, course, currentSemester, batchYear, guardianName, guardianPhone, admissionStatus } = req.body;

    if (req.user?.role === ROLES.HOD && department) {
      const matches = await isHodDepartment(req.user, department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only create student profiles within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }

    const existing = await Student.findOne({ $or: [{ rollNumber }, { user }] });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Student profile already exists with this user or roll number',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const student = await Student.create({
      user,
      rollNumber,
      enrollmentNumber,
      department,
      course,
      currentSemester: currentSemester || 1,
      batchYear,
      guardianName,
      guardianPhone,
      admissionStatus: admissionStatus || 'enrolled'
    });

    await recordAuditLog({
      req,
      action: 'STUDENT_PROFILE_CREATED',
      entityType: 'Student',
      entityId: student._id,
      details: { rollNumber: student.rollNumber, semester: student.currentSemester }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Student profile created successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
}

async function updateStudentProfile(req, res, next) {
  try {
    const { department, course, currentSemester, batchYear, guardianName, guardianPhone, admissionStatus } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Student profile not found',
        code: 'NOT_FOUND'
      });
    }

    if (req.user?.role === ROLES.HOD && student.department) {
      const matches = await isHodDepartment(req.user, student.department._id || student.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only view risk details for students in their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }

    if (req.user?.role === ROLES.HOD && student.department) {
      const matches = await isHodDepartment(req.user, student.department);
      if (!matches) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: HOD can only update student profiles within their assigned department',
          code: 'FORBIDDEN'
        });
      }
    }

    if (department) student.department = department;
    if (course) student.course = course;
    if (currentSemester !== undefined) student.currentSemester = currentSemester;
    if (batchYear) student.batchYear = batchYear;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (admissionStatus) student.admissionStatus = admissionStatus;

    await student.save();
    await student.populate('user', 'name email status lastLogin');
    await student.populate('department', 'name code');
    await student.populate('course', 'name code');

    await recordAuditLog({
      req,
      action: 'STUDENT_PROFILE_UPDATED',
      entityType: 'Student',
      entityId: student._id,
      details: { rollNumber: student.rollNumber, semester: student.currentSemester, status: student.admissionStatus }
    });

    return sendSuccess(res, {
      message: 'Student profile updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Institutional Student At-Risk Identification Endpoint
 * Aggregates live Attendance and Exam Results to detect students at academic risk:
 * - Critical: Attendance < 65% OR >= 2 failed examination subjects
 * - Warning: Attendance 65% - <75% OR 1 failed subject OR avg marks < 45
 * - Safe: Attendance >= 75% AND 0 failed subjects AND avg marks >= 45
 * - Unassessed: No attendance or examination records recorded yet
 */
async function getAtRiskStudents(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const studentQuery = {};

    // Department filter
    if (req.query.department) {
      const deptVal = String(req.query.department).trim();
      if (deptVal && deptVal !== 'all' && deptVal !== '[object Object]' && deptVal !== 'undefined') {
        if (mongoose.Types.ObjectId.isValid(deptVal)) {
          studentQuery.department = deptVal;
        } else {
          const foundDept = await Department.findOne({
            $or: [{ code: deptVal.toUpperCase() }, { name: deptVal }]
          });
          if (foundDept) {
            studentQuery.department = foundDept._id;
          }
        }
      }
    }

    // Semester filter
    if (req.query.semester && req.query.semester !== 'all') {
      const sem = parseInt(req.query.semester, 10);
      if (!isNaN(sem)) studentQuery.currentSemester = sem;
    }

    // Search filter (name, rollNumber, enrollmentNumber)
    const search = req.query.search || req.query.q;
    if (search && typeof search === 'string' && search.trim()) {
      const cleanSearch = search.trim();
      const regex = new RegExp(cleanSearch, 'i');
      let matchingUserIds = [];
      try {
        const matchingUsers = await User.find({ name: regex }).select('_id');
        matchingUserIds = matchingUsers.map((u) => u._id);
      } catch (e) {
        // Fallback if mocked
      }

      studentQuery.$or = [
        { rollNumber: regex },
        { enrollmentNumber: regex },
        ...(matchingUserIds.length > 0 ? [{ user: { $in: matchingUserIds } }] : [])
      ];
    }

    // Status filter - by default active/enrolled students
    if (req.query.status) {
      studentQuery.admissionStatus = req.query.status;
    }

    // Retrieve matching students
    const students = await Student.find(studentQuery)
      .populate('user', 'name email status lastLogin')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .lean();

    if (!students || students.length === 0) {
      return sendSuccess(res, {
        message: 'No student records found matching query',
        data: {
          summary: {
            totalEvaluated: 0,
            criticalCount: 0,
            warningCount: 0,
            safeCount: 0,
            below75Count: 0,
            withRecordsCount: 0,
            unassessedCount: 0
          },
          students: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    const studentIds = students.map((s) => s._id);

    // Fetch Attendance records for these students
    let attendanceRecords = [];
    try {
      attendanceRecords = await Attendance.find({ student: { $in: studentIds } })
        .populate('subject', 'name code')
        .lean();
    } catch (attErr) {
      attendanceRecords = [];
    }

    // Fetch Result records for these students
    let examResults = [];
    try {
      examResults = await Result.find({ student: { $in: studentIds } })
        .populate('subject', 'name code')
        .populate('examination', 'name examType academicYear semester')
        .lean();
    } catch (resErr) {
      examResults = [];
    }

    // Group attendance and results by studentId string
    const attendanceByStudent = {};
    if (Array.isArray(attendanceRecords)) {
      for (const rec of attendanceRecords) {
        const sId = rec.student?.toString() || (rec.student?._id ? rec.student._id.toString() : '');
        if (!sId) continue;
        if (!attendanceByStudent[sId]) attendanceByStudent[sId] = [];
        attendanceByStudent[sId].push(rec);
      }
    }

    const resultsByStudent = {};
    if (Array.isArray(examResults)) {
      for (const resItem of examResults) {
        const sId = resItem.student?.toString() || (resItem.student?._id ? resItem.student._id.toString() : '');
        if (!sId) continue;
        if (!resultsByStudent[sId]) resultsByStudent[sId] = [];
        resultsByStudent[sId].push(resItem);
      }
    }

    // Evaluate risk profile for each student
    const evaluatedStudents = students.map((st) => {
      const sId = st._id.toString();
      const stAttendance = attendanceByStudent[sId] || [];
      const stResults = resultsByStudent[sId] || [];

      // Attendance statistics
      const totalClasses = stAttendance.length;
      const presentClasses = stAttendance.filter((a) => a.status === 'present').length;
      const absentClasses = stAttendance.filter((a) => a.status === 'absent').length;
      const lateClasses = stAttendance.filter((a) => a.status === 'late').length;
      const excusedClasses = stAttendance.filter((a) => a.status === 'excused').length;
      const hasAttendanceRecords = totalClasses > 0;
      const attendancePercentage = hasAttendanceRecords
        ? Number(((presentClasses / totalClasses) * 100).toFixed(1))
        : null;

      // Find last attendance date
      let lastAttendanceDate = null;
      if (hasAttendanceRecords) {
        const sortedDates = [...stAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));
        lastAttendanceDate = sortedDates[0]?.date || null;
      }

      // Academic performance statistics
      const totalExams = stResults.length;
      const failedSubjects = stResults.filter((r) => r.status === 'failed' || r.grade === 'F' || r.grade === 'AB');
      const passedSubjects = stResults.filter((r) => r.status === 'passed' && r.grade !== 'F' && r.grade !== 'AB');
      const totalMarksSum = stResults.reduce((acc, curr) => acc + (Number(curr.totalMarks) || 0), 0);
      const averageMarks = totalExams > 0 ? Number((totalMarksSum / totalExams).toFixed(1)) : null;

      // Risk classification rules
      let riskLevel = 'safe';
      const riskReasons = [];
      let riskWeight = 1; // 1 = safe, 2 = warning, 3 = critical, 0 = unassessed

      if (!hasAttendanceRecords && totalExams === 0) {
        riskLevel = 'unassessed';
        riskWeight = 0;
        riskReasons.push('No attendance or examination records logged');
      } else {
        const criticalReasons = [];
        const warningReasons = [];

        // Attendance risk checks
        if (hasAttendanceRecords) {
          if (attendancePercentage < 65) {
            criticalReasons.push(`Critical attendance shortage: ${attendancePercentage}% (below 65% minimum)`);
          } else if (attendancePercentage < 75) {
            warningReasons.push(`Attendance warning: ${attendancePercentage}% (below 75% requirement)`);
          }
        }

        // Academic risk checks
        if (failedSubjects.length >= 2) {
          criticalReasons.push(`Multiple course failures: ${failedSubjects.length} subjects failed`);
        } else if (failedSubjects.length === 1) {
          const subName = failedSubjects[0].subject?.name || failedSubjects[0].subject?.code || 'Course';
          warningReasons.push(`Academic backlog: Failed in ${subName}`);
        } else if (totalExams > 0 && averageMarks !== null && averageMarks < 45) {
          warningReasons.push(`Low academic scoring: Average marks ${averageMarks}%`);
        }

        // Decision assignment
        if (criticalReasons.length > 0) {
          riskLevel = 'critical';
          riskWeight = 3;
          riskReasons.push(...criticalReasons);
          if (warningReasons.length > 0) riskReasons.push(...warningReasons);
        } else if (warningReasons.length > 0) {
          riskLevel = 'warning';
          riskWeight = 2;
          riskReasons.push(...warningReasons);
        } else {
          riskLevel = 'safe';
          riskWeight = 1;
          const reasons = [];
          if (hasAttendanceRecords) reasons.push(`Good attendance (${attendancePercentage}%)`);
          if (totalExams > 0) reasons.push(`All exams cleared (Avg: ${averageMarks || 0}%)`);
          riskReasons.push(reasons.length > 0 ? reasons.join(' & ') : 'Satisfactory standing');
        }
      }

      return {
        id: st._id,
        studentId: st._id,
        rollNumber: st.rollNumber,
        enrollmentNumber: st.enrollmentNumber || null,
        name: st.user?.name || 'Unnamed Student',
        email: st.user?.email || null,
        department: {
          id: st.department?._id || st.department,
          name: st.department?.name || 'Unassigned',
          code: st.department?.code || ''
        },
        course: {
          id: st.course?._id || st.course,
          name: st.course?.name || '',
          code: st.course?.code || ''
        },
        currentSemester: st.currentSemester,
        batchYear: st.batchYear,
        guardianName: st.guardianName || null,
        guardianPhone: st.guardianPhone || null,
        admissionStatus: st.admissionStatus,
        attendance: {
          totalClasses,
          presentClasses,
          absentClasses,
          lateClasses,
          excusedClasses,
          percentage: attendancePercentage,
          hasRecords: hasAttendanceRecords
        },
        academic: {
          totalEvaluated: totalExams,
          passedCount: passedSubjects.length,
          failedCount: failedSubjects.length,
          averageMarks,
          failedSubjects: failedSubjects.map((f) => ({
            subject: f.subject?.name || 'Subject',
            code: f.subject?.code || '',
            marks: f.totalMarks,
            grade: f.grade
          }))
        },
        riskLevel,
        riskWeight,
        riskReasons,
        lastAttendanceDate
      };
    });

    // Institutional Summary Counts (across the full evaluated set matching filters)
    const summary = {
      totalEvaluated: evaluatedStudents.length,
      criticalCount: evaluatedStudents.filter((s) => s.riskLevel === 'critical').length,
      warningCount: evaluatedStudents.filter((s) => s.riskLevel === 'warning').length,
      safeCount: evaluatedStudents.filter((s) => s.riskLevel === 'safe').length,
      unassessedCount: evaluatedStudents.filter((s) => s.riskLevel === 'unassessed').length,
      below75Count: evaluatedStudents.filter(
        (s) => s.attendance.hasRecords && s.attendance.percentage !== null && s.attendance.percentage < 75
      ).length,
      withRecordsCount: evaluatedStudents.filter((s) => s.attendance.hasRecords).length
    };

    // Filter by riskLevel if requested
    const requestedRisk = req.query.riskLevel || req.query.risk;
    let filteredStudents = evaluatedStudents;
    if (requestedRisk && requestedRisk !== 'all') {
      if (requestedRisk === 'below75') {
        filteredStudents = evaluatedStudents.filter(
          (s) => s.attendance.hasRecords && s.attendance.percentage !== null && s.attendance.percentage < 75
        );
      } else {
        filteredStudents = evaluatedStudents.filter((s) => s.riskLevel === requestedRisk.toLowerCase());
      }
    }

    // Sort: default highest risk first, then lowest attendance percentage
    const sortBy = req.query.sortBy || 'risk';
    filteredStudents.sort((a, b) => {
      if (sortBy === 'attendance_asc') {
        if (a.attendance.percentage === null) return 1;
        if (b.attendance.percentage === null) return -1;
        return a.attendance.percentage - b.attendance.percentage;
      }
      if (sortBy === 'attendance_desc') {
        if (a.attendance.percentage === null) return 1;
        if (b.attendance.percentage === null) return -1;
        return b.attendance.percentage - a.attendance.percentage;
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'rollNumber') {
        return (a.rollNumber || '').localeCompare(b.rollNumber || '');
      }
      // Default: risk descending (critical > warning > safe > unassessed)
      if (b.riskWeight !== a.riskWeight) {
        return b.riskWeight - a.riskWeight;
      }
      // If same risk weight, sort by lowest attendance %
      const aPct = a.attendance.percentage !== null ? a.attendance.percentage : 999;
      const bPct = b.attendance.percentage !== null ? b.attendance.percentage : 999;
      return aPct - bPct;
    });

    // Pagination
    const paginatedTotal = filteredStudents.length;
    const paginatedStudents = filteredStudents.slice(skip, skip + limit);

    return sendSuccess(res, {
      message: 'At-risk students evaluated successfully',
      data: {
        summary,
        students: paginatedStudents,
        pagination: {
          page,
          limit,
          total: paginatedTotal,
          totalPages: Math.ceil(paginatedTotal / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Detailed Student Risk & Attendance Breakdown
 */
async function getStudentRiskDetails(req, res, next) {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email status lastLogin phone')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .lean();

    if (!student) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Student profile not found',
        code: 'NOT_FOUND'
      });
    }

    // Attendance records
    let attendanceRecords = [];
    try {
      attendanceRecords = await Attendance.find({ student: student._id })
        .populate('subject', 'name code')
        .populate('faculty', 'name email')
        .sort({ date: -1 })
        .lean();
    } catch (e) {
      attendanceRecords = [];
    }

    // Results records
    let resultRecords = [];
    try {
      resultRecords = await Result.find({ student: student._id })
        .populate('subject', 'name code credits')
        .populate('examination', 'name examType academicYear semester')
        .sort({ createdAt: -1 })
        .lean();
    } catch (e) {
      resultRecords = [];
    }

    // Overall attendance calculation
    const totalClasses = Array.isArray(attendanceRecords) ? attendanceRecords.length : 0;
    const presentClasses = Array.isArray(attendanceRecords)
      ? attendanceRecords.filter((a) => a.status === 'present').length
      : 0;
    const absentClasses = Array.isArray(attendanceRecords)
      ? attendanceRecords.filter((a) => a.status === 'absent').length
      : 0;
    const lateClasses = Array.isArray(attendanceRecords)
      ? attendanceRecords.filter((a) => a.status === 'late').length
      : 0;
    const excusedClasses = Array.isArray(attendanceRecords)
      ? attendanceRecords.filter((a) => a.status === 'excused').length
      : 0;
    const hasRecords = totalClasses > 0;
    const percentage = hasRecords ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : null;

    // Subject-wise attendance breakdown
    const subjectMap = {};
    if (Array.isArray(attendanceRecords)) {
      for (const rec of attendanceRecords) {
        const subId = rec.subject?._id ? rec.subject._id.toString() : (rec.subject ? rec.subject.toString() : 'general');
        const subName = rec.subject?.name || 'General';
        const subCode = rec.subject?.code || '';

        if (!subjectMap[subId]) {
          subjectMap[subId] = {
            subjectId: subId,
            subjectName: subName,
            subjectCode: subCode,
            totalClasses: 0,
            presentClasses: 0,
            absentClasses: 0,
            lateClasses: 0,
            excusedClasses: 0
          };
        }
        subjectMap[subId].totalClasses += 1;
        if (rec.status === 'present') subjectMap[subId].presentClasses += 1;
        if (rec.status === 'absent') subjectMap[subId].absentClasses += 1;
        if (rec.status === 'late') subjectMap[subId].lateClasses += 1;
        if (rec.status === 'excused') subjectMap[subId].excusedClasses += 1;
      }
    }

    const subjectBreakdown = Object.values(subjectMap).map((sub) => ({
      ...sub,
      percentage: sub.totalClasses > 0 ? Number(((sub.presentClasses / sub.totalClasses) * 100).toFixed(1)) : 0
    }));

    // Examination evaluation
    const validResults = Array.isArray(resultRecords) ? resultRecords : [];
    const failedResults = validResults.filter((r) => r.status === 'failed' || r.grade === 'F' || r.grade === 'AB');
    const totalMarksSum = validResults.reduce((acc, curr) => acc + (Number(curr.totalMarks) || 0), 0);
    const averageMarks = validResults.length > 0 ? Number((totalMarksSum / validResults.length).toFixed(1)) : null;

    // Risk classification
    let riskLevel = 'safe';
    const reasons = [];

    if (!hasRecords && validResults.length === 0) {
      riskLevel = 'unassessed';
      reasons.push('No attendance or examination logs registered yet');
    } else {
      if (hasRecords && percentage < 65) {
        riskLevel = 'critical';
        reasons.push(`Attendance critically low at ${percentage}% (below 65% threshold)`);
      } else if (hasRecords && percentage < 75) {
        if (riskLevel !== 'critical') riskLevel = 'warning';
        reasons.push(`Attendance at ${percentage}%, under mandatory 75% minimum`);
      }

      if (failedResults.length >= 2) {
        riskLevel = 'critical';
        reasons.push(`${failedResults.length} subjects with failing grades`);
      } else if (failedResults.length === 1) {
        if (riskLevel !== 'critical') riskLevel = 'warning';
        reasons.push(`1 subject failure (${failedResults[0].subject?.name || 'Backlog'})`);
      } else if (validResults.length > 0 && averageMarks !== null && averageMarks < 45) {
        if (riskLevel !== 'critical') riskLevel = 'warning';
        reasons.push(`Low average score: ${averageMarks}%`);
      }

      if (reasons.length === 0) {
        reasons.push('Good academic standing and satisfactory attendance');
      }
    }

    return sendSuccess(res, {
      message: 'Student risk details retrieved',
      data: {
        student: {
          id: student._id,
          rollNumber: student.rollNumber,
          enrollmentNumber: student.enrollmentNumber,
          name: student.user?.name || 'Student',
          email: student.user?.email,
          phone: student.user?.phone,
          department: student.department?.name || 'Department',
          departmentCode: student.department?.code || '',
          course: student.course?.name || 'Course',
          semester: student.currentSemester,
          batchYear: student.batchYear,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          admissionStatus: student.admissionStatus
        },
        riskAssessment: {
          riskLevel,
          reasons,
          averageMarks,
          totalExamsEvaluated: validResults.length,
          failedCount: failedResults.length
        },
        attendanceSummary: {
          totalClasses,
          presentClasses,
          absentClasses,
          lateClasses,
          excusedClasses,
          percentage,
          hasRecords
        },
        subjectBreakdown,
        recentAttendance: (Array.isArray(attendanceRecords) ? attendanceRecords : []).slice(0, 15).map((a) => ({
          id: a._id,
          date: a.date,
          periodNumber: a.periodNumber,
          status: a.status,
          remarks: a.remarks,
          subject: a.subject?.name || 'Subject',
          subjectCode: a.subject?.code || '',
          faculty: a.faculty?.name || 'Faculty'
        })),
        examResults: validResults.map((r) => ({
          id: r._id,
          examName: r.examination?.name || 'Exam',
          examType: r.examination?.examType || 'Regular',
          academicYear: r.examination?.academicYear,
          semester: r.examination?.semester,
          subject: r.subject?.name || 'Subject',
          subjectCode: r.subject?.code || '',
          credits: r.subject?.credits || 0,
          internalMarks: r.internalMarks,
          externalMarks: r.externalMarks,
          totalMarks: r.totalMarks,
          grade: r.grade,
          status: r.status
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listStudents,
  getStudentById,
  getMyStudentProfile,
  createStudentProfile,
  updateStudentProfile,
  getAtRiskStudents,
  getStudentRiskDetails
};
