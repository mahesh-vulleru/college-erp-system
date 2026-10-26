const Student = require('../students/student.model');
const Faculty = require('../faculty/faculty.model');
const Department = require('../departments/department.model');
const Attendance = require('../attendance/attendance.model');
const Payment = require('../payments/payment.model');
const { sendSuccess } = require('../../utils/response');

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

module.exports = {
  getAcademicSummary,
  getAttendanceOverview,
  getFeeCollectionSummary
};

