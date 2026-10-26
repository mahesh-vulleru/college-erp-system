const Student = require('../students/student.model');
const Faculty = require('../faculty/faculty.model');
const Department = require('../departments/department.model');
const Course = require('../courses/course.model');
const Subject = require('../subjects/subject.model');
const Attendance = require('../attendance/attendance.model');
const Payment = require('../payments/payment.model');
const FeeStructure = require('../fees/fee.model');
const User = require('../auth/auth.model');
const AuditLog = require('../audit-logs/audit.model');
const { sendSuccess } = require('../../utils/response');
const { ROLES, USER_STATUS } = require('@college-erp/shared');

/**
 * GET /api/v1/reports/academic-summary
 */
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

/**
 * GET /api/v1/reports/attendance-overview
 */
async function getAttendanceOverview(req, res, next) {
  try {
    const totalRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({ status: 'present' });
    const collegeAverage = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : '85.0';

    return sendSuccess(res, {
      message: 'Attendance health overview retrieved',
      data: {
        totalMarkedSessions: totalRecords,
        collegeAveragePercentage: Number(collegeAverage),
        thresholdStatus: Number(collegeAverage) >= 75 ? 'Healthy' : 'Needs Attention'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports/fee-collection
 */
async function getFeeCollectionSummary(req, res, next) {
  try {
    const payments = await Payment.find({ status: 'completed' });
    const totalCollected = payments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

    return sendSuccess(res, {
      message: 'Finance and fee collection summary retrieved',
      data: {
        totalTransactions: payments.length,
        totalCollectedAmount: totalCollected,
        currency: 'INR'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports/admin-overview
 * Comprehensive live overview across all ERP subsystems for Super Admin & Overview Hub
 */
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
      Payment.countDocuments(),
      Payment.find({ status: 'completed' }),
      AuditLog.countDocuments(),
      AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(8)
    ]);

    const totalCollected = completedPayments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

    return sendSuccess(res, {
      message: 'Executive admin overview retrieved successfully',
      data: {
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
          totalPayments,
          completedTransactions: completedPayments.length,
          totalCollectedAmount: totalCollected,
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

/**
 * GET /api/v1/reports/department-summaries
 * Department-level analytics with enrolled students, faculty count, and HOD status
 */
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

module.exports = {
  getAcademicSummary,
  getAttendanceOverview,
  getFeeCollectionSummary,
  getAdminOverview,
  getDepartmentSummaries
};
