const Student = require('../students/student.model');
const Faculty = require('../faculty/faculty.model');
const Department = require('../departments/department.model');
const Course = require('../courses/course.model');
const Subject = require('../subjects/subject.model');
const Timetable = require('../timetable/timetable.model');
const Attendance = require('../attendance/attendance.model');
const Examination = require('../examinations/exam.model');
const Result = require('../results/result.model');
const Payment = require('../payments/payment.model');
const FeeStructure = require('../fees/fee.model');
const Invoice = require('../fees/invoice.model');
const User = require('../auth/auth.model');
const AuditLog = require('../audit-logs/audit.model');
const { computeInvoiceBalance } = require('../fees/fee.controller');
const { sendSuccess, sendError } = require('../../utils/response');
const { ROLES, USER_STATUS, HTTP_STATUS } = require('@college-erp/shared');

/**
 * Decimal rounder helper
 */
function roundMoney(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

// ------------------------------------------------------------------
// EXISTING SUMMARY METRICS (Preserved for compatibility)
// ------------------------------------------------------------------

async function getAcademicSummary(req, res, next) {
  try {
    const [totalStudents, totalFaculty, totalDepartments] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Department.countDocuments()
    ]);

    return sendSuccess(res, {
      message: 'Institution-wide academic summary retrieved',
      data: {
        timestamp: new Date().toISOString(),
        totalStudents,
        totalFaculty,
        totalDepartments,
        targetCapacity: 1000,
        enrollmentRatio: ((totalStudents / 1000) * 100).toFixed(1) + '%'
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAttendanceOverview(req, res, next) {
  try {
    const totalRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({ status: 'present' });
    const collegeAverage = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : '85.0';

    return sendSuccess(res, {
      message: 'Attendance health overview retrieved',
      data: {
        timestamp: new Date().toISOString(),
        totalMarkedSessions: totalRecords,
        collegeAveragePercentage: Number(collegeAverage),
        thresholdStatus: Number(collegeAverage) >= 75 ? 'Healthy' : 'Needs Attention'
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getFeeCollectionSummary(req, res, next) {
  try {
    const payments = await Payment.find({ status: 'completed' });
    const totalCollected = payments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

    return sendSuccess(res, {
      message: 'Finance and fee collection summary retrieved',
      data: {
        timestamp: new Date().toISOString(),
        totalTransactions: payments.length,
        totalCollectedAmount: roundMoney(totalCollected),
        currency: 'INR'
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminOverview(req, res, next) {
  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      superAdminCount,
      principalCount,
      hodCount,
      facultyCount,
      studentCount,
      accountsCount,
      totalDepartments,
      totalCourses,
      totalSubjects,
      totalFacultyProfiles,
      totalStudentProfiles,
      totalFeePlans,
      totalInvoices,
      totalPayments,
      completedPayments,
      totalAuditLogs,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: USER_STATUS.ACTIVE }),
      User.countDocuments({ status: USER_STATUS.DISABLED }),
      User.countDocuments({ role: ROLES.SUPER_ADMIN }),
      User.countDocuments({ role: ROLES.PRINCIPAL }),
      User.countDocuments({ role: ROLES.HOD }),
      User.countDocuments({ role: ROLES.FACULTY }),
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.ACCOUNTS }),
      Department.countDocuments(),
      Course.countDocuments(),
      Subject.countDocuments(),
      Faculty.countDocuments(),
      Student.countDocuments(),
      FeeStructure.countDocuments(),
      Invoice.countDocuments(),
      Payment.countDocuments(),
      Payment.find({ status: 'completed' }),
      AuditLog.countDocuments(),
      AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(8)
    ]);

    const totalCollected = completedPayments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

    return sendSuccess(res, {
      message: 'Executive admin overview retrieved successfully',
      data: {
        timestamp: new Date().toISOString(),
        users: {
          total: totalUsers,
          active: activeUsers,
          disabled: disabledUsers,
          byRole: {
            [ROLES.SUPER_ADMIN]: superAdminCount,
            [ROLES.PRINCIPAL]: principalCount,
            [ROLES.HOD]: hodCount,
            [ROLES.FACULTY]: facultyCount,
            [ROLES.STUDENT]: studentCount,
            [ROLES.ACCOUNTS]: accountsCount
          }
        },
        academic: {
          departments: totalDepartments,
          courses: totalCourses,
          subjects: totalSubjects,
          facultyProfiles: totalFacultyProfiles,
          studentProfiles: totalStudentProfiles,
          targetCapacity: 1000
        },
        finance: {
          feeStructures: totalFeePlans,
          totalInvoices,
          totalPayments,
          completedTransactions: completedPayments.length,
          totalCollectedAmount: roundMoney(totalCollected),
          currency: 'INR'
        },
        audit: {
          totalLogs: totalAuditLogs,
          recentActivities: recentLogs
        },
        system: {
          status: 'Operational',
          database: 'Connected',
          nodeVersion: process.version,
          platform: process.platform,
          uptimeSeconds: Math.floor(process.uptime()),
          environment: process.env.NODE_ENV || 'development'
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getDepartmentSummaries(req, res, next) {
  try {
    const departments = await Department.find().populate('hod', 'name email role department');

    const summaries = await Promise.all(
      departments.map(async (dept) => {
        const [studentCount, facultyCount, subjectCount] = await Promise.all([
          Student.countDocuments({ department: dept._id }),
          Faculty.countDocuments({ department: dept._id }),
          Subject.countDocuments({ department: dept._id })
        ]);

        const capacity = dept.intakeCapacity || 60;
        const utilization = ((studentCount / capacity) * 100).toFixed(1);

        return {
          id: dept._id,
          name: dept.name,
          code: dept.code,
          intakeCapacity: capacity,
          description: dept.description,
          isActive: dept.isActive,
          hod: dept.hod,
          hasHod: !!dept.hod,
          studentCount,
          facultyCount,
          subjectCount,
          utilizationPercentage: Number(utilization)
        };
      })
    );

    return sendSuccess(res, {
      message: 'Department summaries retrieved successfully',
      data: summaries
    });
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------------
// PHASE 3 DETAILED DATA-BACKED EXECUTIVE REPORTS
// ------------------------------------------------------------------

/**
 * 1. ENROLLMENT REPORT
 * Breakdown by department, program/course, and semester
 */
async function getEnrollmentReport(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.course) query.course = req.query.course;
    if (req.query.semester) query.currentSemester = parseInt(req.query.semester, 10);

    const students = await Student.find(query)
      .populate('user', 'name email status')
      .populate('department', 'name code intakeCapacity')
      .populate('course', 'name code degreeType');

    // Aggregate by Department
    const byDepartment = {};
    const bySemester = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    const byProgram = {};

    students.forEach((s) => {
      const deptName = s.department?.name || 'Unassigned';
      if (!byDepartment[deptName]) {
        byDepartment[deptName] = {
          departmentName: deptName,
          code: s.department?.code || '',
          intakeCapacity: s.department?.intakeCapacity || 60,
          enrolledCount: 0
        };
      }
      byDepartment[deptName].enrolledCount += 1;

      const sem = s.currentSemester || 1;
      if (bySemester[sem] !== undefined) {
        bySemester[sem] += 1;
      }

      const progName = s.course?.name || 'B.Tech Core';
      byProgram[progName] = (byProgram[progName] || 0) + 1;
    });

    return sendSuccess(res, {
      message: 'Data-backed enrollment report generated',
      data: {
        timestamp: new Date().toISOString(),
        metricDefinition: 'Actual student count persisted in database with active profile references',
        totalEnrolled: students.length,
        byDepartment: Object.values(byDepartment),
        bySemester,
        byProgram,
        recordsSample: students.slice(0, 10).map((s) => ({
          id: s._id,
          rollNumber: s.rollNumber,
          name: s.user?.name,
          department: s.department?.code,
          semester: s.currentSemester
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. FACULTY & COURSE ALLOCATION REPORT
 */
async function getFacultyAllocationReport(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;

    const [facultyList, timetableSlots, subjects] = await Promise.all([
      Faculty.find(query)
        .populate('user', 'name email status')
        .populate('department', 'name code'),
      Timetable.find().populate('faculty subject department'),
      Subject.find().populate('course department')
    ]);

    // Workload calculation from timetable slots
    const facultyWorkload = facultyList.map((f) => {
      const slots = timetableSlots.filter((ts) => ts.faculty?._id?.toString() === f._id.toString());
      const uniqueSubjects = [...new Set(slots.map((s) => s.subject?.name).filter(Boolean))];

      return {
        id: f._id,
        employeeId: f.employeeId,
        name: f.user?.name || 'N/A',
        email: f.user?.email || 'N/A',
        department: f.department?.name || 'N/A',
        departmentCode: f.department?.code || '',
        designation: f.designation,
        totalTeachingHoursPerWeek: slots.length,
        allocatedSubjects: uniqueSubjects
      };
    });

    const byDesignation = {};
    facultyList.forEach((f) => {
      byDesignation[f.designation] = (byDesignation[f.designation] || 0) + 1;
    });

    return sendSuccess(res, {
      message: 'Faculty and teaching allocation report generated',
      data: {
        timestamp: new Date().toISOString(),
        metricDefinition: 'Live faculty workload compiled from master timetable assignments and profile records',
        totalFaculty: facultyList.length,
        totalCourseSubjects: subjects.length,
        byDesignation,
        allocations: facultyWorkload
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. ATTENDANCE ANALYTICS REPORT
 */
async function getAttendanceReport(req, res, next) {
  try {
    const query = {};

    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    if (req.query.subject) query.subject = req.query.subject;

    const records = await Attendance.find(query)
      .populate('student', 'rollNumber currentSemester')
      .populate('subject', 'name code');

    const totalRecords = records.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    // Student level aggregate
    const studentAggregate = {};

    records.forEach((r) => {
      if (r.status === 'present') presentCount += 1;
      else if (r.status === 'absent') absentCount += 1;
      else if (r.status === 'late') lateCount += 1;
      else if (r.status === 'excused') excusedCount += 1;

      const sId = r.student?._id?.toString();
      if (sId) {
        if (!studentAggregate[sId]) {
          studentAggregate[sId] = {
            rollNumber: r.student.rollNumber,
            total: 0,
            present: 0
          };
        }
        studentAggregate[sId].total += 1;
        if (r.status === 'present') studentAggregate[sId].present += 1;
      }
    });

    // Students below 75% condonation threshold
    const criticalStudents = Object.values(studentAggregate)
      .map((s) => ({
        rollNumber: s.rollNumber,
        totalSessions: s.total,
        presentSessions: s.present,
        attendancePercentage: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(1)) : 0
      }))
      .filter((s) => s.attendancePercentage < 75);

    const overallPercentage = totalRecords > 0 ? Number(((presentCount / totalRecords) * 100).toFixed(1)) : 100;

    return sendSuccess(res, {
      message: 'Data-backed attendance analytics report generated',
      data: {
        timestamp: new Date().toISOString(),
        metricDefinition: 'Attendance capture percentage computed over logged classroom session records',
        dateRange: {
          startDate: req.query.startDate || 'All recorded periods',
          endDate: req.query.endDate || 'Present'
        },
        totalSessionsLogged: totalRecords,
        overallPercentage,
        statusBreakdown: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount
        },
        thresholdRiskCount: criticalStudents.length,
        criticalAttendanceAlerts: criticalStudents.slice(0, 15)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. EXAMINATIONS SCHEDULE & STATUS REPORT
 */
async function getExaminationsReport(req, res, next) {
  try {
    const query = {};
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);

    const now = new Date();
    const exams = await Examination.find(query).sort({ startDate: 1 });

    const analyzedExams = exams.map((e) => {
      let timelineStatus = 'Upcoming';
      if (e.startDate <= now && e.endDate >= now) {
        timelineStatus = 'In Progress';
      } else if (e.endDate < now) {
        timelineStatus = 'Completed';
      }

      return {
        id: e._id,
        name: e.name,
        examType: e.examType,
        academicYear: e.academicYear,
        semester: e.semester,
        startDate: e.startDate,
        endDate: e.endDate,
        timelineStatus,
        isPublished: e.isPublished,
        resultsStatus: e.isPublished ? 'Published & Available' : 'Under Tabulation / Pending Approval'
      };
    });

    return sendSuccess(res, {
      message: 'Examination schedules and status report generated',
      data: {
        timestamp: new Date().toISOString(),
        metricDefinition: 'Timeline classification of scheduled internal mid-terms and university semester assessments',
        totalExamsScheduled: analyzedExams.length,
        exams: analyzedExams
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. PUBLISHED RESULTS & ACADEMIC PERFORMANCE REPORT
 * Never exposes unpublished exam marks!
 */
async function getResultsSummaryReport(req, res, next) {
  try {
    // Only published examinations
    const publishedExams = await Examination.find({ isPublished: true }).select('_id name academicYear semester');
    const publishedExamIds = publishedExams.map((e) => e._id);

    const query = { examination: { $in: publishedExamIds } };
    if (req.query.examination) {
      if (publishedExamIds.map((id) => id.toString()).includes(req.query.examination)) {
        query.examination = req.query.examination;
      } else {
        return sendSuccess(res, {
          message: 'Selected examination results are not published yet.',
          data: {
            timestamp: new Date().toISOString(),
            isPublished: false,
            message: 'Results for this examination are currently unpublished and cannot be accessed.'
          }
        });
      }
    }

    const results = await Result.find(query)
      .populate('examination', 'name examType academicYear semester')
      .populate('student', 'rollNumber')
      .populate('subject', 'name code credits');

    const totalGraded = results.length;
    let passedCount = 0;
    let failedCount = 0;
    const gradeDistribution = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, F: 0, AB: 0 };

    results.forEach((r) => {
      if (r.status === 'passed') passedCount += 1;
      else failedCount += 1;

      if (gradeDistribution[r.grade] !== undefined) {
        gradeDistribution[r.grade] += 1;
      }
    });

    const passPercentage = totalGraded > 0 ? Number(((passedCount / totalGraded) * 100).toFixed(1)) : 0;

    return sendSuccess(res, {
      message: 'Published academic results performance report generated',
      data: {
        timestamp: new Date().toISOString(),
        metricDefinition: 'Aggregated student performance computed strictly from authorized published examination results',
        totalGradedEntries: totalGraded,
        passedCount,
        failedCount,
        passPercentage,
        gradeDistribution,
        publishedExaminationsIncluded: publishedExams
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. FINANCIAL RECONCILIATION & DUES LEDGER REPORT
 */
async function getFinancialReport(req, res, next) {
  try {
    const query = {};
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);

    const [invoices, payments] = await Promise.all([
      Invoice.find(query).populate('student', 'rollNumber department'),
      Payment.find({ status: { $in: ['completed', 'refunded'] } })
    ]);

    const calculatedInvoices = await Promise.all(invoices.map((inv) => computeInvoiceBalance(inv)));

    let totalInvoiced = 0;
    let totalWaivers = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let paidInvoicesCount = 0;
    let partialInvoicesCount = 0;
    let unpaidInvoicesCount = 0;

    calculatedInvoices.forEach((inv) => {
      totalInvoiced += inv.amountDue;
      totalWaivers += inv.totalWaivers;
      totalCollected += inv.totalVerifiedPayments;
      totalOutstanding += inv.outstandingBalance;

      if (inv.derivedStatus === 'paid' || inv.derivedStatus === 'waived') paidInvoicesCount += 1;
      else if (inv.derivedStatus === 'partial') partialInvoicesCount += 1;
      else unpaidInvoicesCount += 1;
    });

    const totalRefunded = payments.reduce((acc, p) => acc + (p.refundAmount || 0), 0);

    return sendSuccess(res, {
      message: 'Institutional finance and dues ledger report generated',
      data: {
        timestamp: new Date().toISOString(),
        metricDefinition: 'Exact decimal monetary balances calculated from stored student fee invoices, verified cashier payments, and approved waivers',
        currency: 'INR',
        totals: {
          totalInvoicedAmount: roundMoney(totalInvoiced),
          totalWaiversApproved: roundMoney(totalWaivers),
          totalNetCollected: roundMoney(totalCollected),
          totalRefundsProcessed: roundMoney(totalRefunded),
          netOutstandingDues: roundMoney(totalOutstanding)
        },
        invoiceCounts: {
          total: calculatedInvoices.length,
          settled: paidInvoicesCount,
          partiallyPaid: partialInvoicesCount,
          unpaid: unpaidInvoicesCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. ADMINISTRATIVE & AUDIT ACTIVITY REPORT
 */
async function getAdminActivityReport(req, res, next) {
  try {
    const query = {};
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const [totalLogs, successCount, failureCount, logsByModule, recentEvents] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.countDocuments({ ...query, outcome: 'success' }),
      AuditLog.countDocuments({ ...query, outcome: 'failure' }),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$entityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.find(query).populate('user', 'name email role').sort({ createdAt: -1 }).limit(10)
    ]);

    return sendSuccess(res, {
      message: 'Administrative security and audit events report generated',
      data: {
        timestamp: new Date().toISOString(),
        metricDefinition: 'Security audit events persisted across institutional authentication, academic approvals, and financial transactions',
        totalEvents: totalLogs,
        successCount,
        failureCount,
        byModule: logsByModule.map((m) => ({ module: m._id || 'System', count: m.count })),
        recentCriticalEvents: recentEvents
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * CSV EXPORT DISPATCHER (Authorized)
 */
async function exportReportCsv(req, res, next) {
  try {
    const reportType = req.query.type;

    if (reportType === 'enrollment') {
      const students = await Student.find()
        .populate('user', 'name email')
        .populate('department', 'name code')
        .populate('course', 'name code');

      const headers = ['Roll Number', 'Student Name', 'Email', 'Department', 'Semester', 'Program'];
      const rows = students.map((s) => [
        s.rollNumber,
        `"${(s.user?.name || '').replace(/"/g, '""')}"`,
        s.user?.email || '',
        s.department?.code || '',
        s.currentSemester,
        s.course?.code || ''
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="enrollment-report.csv"');
      return res.status(HTTP_STATUS.OK).send(csv);
    }

    if (reportType === 'attendance') {
      const records = await Attendance.find()
        .populate('student', 'rollNumber')
        .populate('subject', 'name code')
        .limit(500);

      const headers = ['Date', 'Roll Number', 'Subject Code', 'Subject Name', 'Period', 'Status'];
      const rows = records.map((r) => [
        r.date ? new Date(r.date).toISOString().split('T')[0] : '',
        r.student?.rollNumber || '',
        r.subject?.code || '',
        `"${(r.subject?.name || '').replace(/"/g, '""')}"`,
        r.periodNumber,
        r.status
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
      return res.status(HTTP_STATUS.OK).send(csv);
    }

    if (reportType === 'finance') {
      const invoices = await Invoice.find().populate({
        path: 'student',
        select: 'rollNumber',
        populate: { path: 'user', select: 'name' }
      });
      const calculated = await Promise.all(invoices.map((inv) => computeInvoiceBalance(inv)));

      const headers = ['Invoice Number', 'Student Roll', 'Amount Due (INR)', 'Waivers (INR)', 'Paid (INR)', 'Balance (INR)', 'Status'];
      const rows = calculated.map((inv) => [
        inv.invoiceNumber,
        inv.student?.rollNumber || '',
        inv.amountDue.toFixed(2),
        inv.totalWaivers.toFixed(2),
        inv.totalVerifiedPayments.toFixed(2),
        inv.outstandingBalance.toFixed(2),
        inv.derivedStatus
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="finance-dues-report.csv"');
      return res.status(HTTP_STATUS.OK).send(csv);
    }

    return sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Unknown or missing export report type. Allowed: enrollment, attendance, finance.',
      code: 'INVALID_REPORT_TYPE'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAcademicSummary,
  getAttendanceOverview,
  getFeeCollectionSummary,
  getAdminOverview,
  getDepartmentSummaries,
  getEnrollmentReport,
  getFacultyAllocationReport,
  getAttendanceReport,
  getExaminationsReport,
  getResultsSummaryReport,
  getFinancialReport,
  getAdminActivityReport,
  exportReportCsv
};
