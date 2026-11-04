const mongoose = require('mongoose');
const Student = require('./student.model');
const ParentStudentLink = require('./parentStudentLink.model');
const Attendance = require('../attendance/attendance.model');
const Result = require('../results/result.model');
const Invoice = require('../fees/invoice.model');
const Payment = require('../payments/payment.model');
const { BookIssue, LibraryFine } = require('../library/models');
const { StudentTransportAllocation } = require('../transport/models');
const { ROLES, HTTP_STATUS } = require('@college-erp/shared');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Get comprehensive 360° Profile for a student
 * Enforces strict role-based data isolation
 */
async function getStudent360(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    let student = null;

    if (id === 'me' || user.role === ROLES.STUDENT) {
      student = await Student.findOne({ user: user._id })
        .populate('user', 'name email phone avatar status')
        .populate('department', 'name code')
        .populate('course', 'name code totalSemesters');
      if (!student) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not found for the authenticated account.'
        });
      }
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        student = await Student.findOne({ rollNumber: id.toUpperCase().trim() })
          .populate('user', 'name email phone avatar status')
          .populate('department', 'name code')
          .populate('course', 'name code totalSemesters');
      } else {
        student = await Student.findById(id)
          .populate('user', 'name email phone avatar status')
          .populate('department', 'name code')
          .populate('course', 'name code totalSemesters');
      }

      if (!student) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student record not found.'
        });
      }

      // Security & Authorization checks
      if (user.role === ROLES.PARENT) {
        const link = await ParentStudentLink.findOne({
          parent: user._id,
          student: student._id,
          status: 'active'
        });

        if (!link) {
          logger.warn(`[SECURITY] Unauthorized Parent access attempt: Parent ${user.email} -> Student ${student.rollNumber}`);
          return sendError(res, {
            statusCode: HTTP_STATUS.FORBIDDEN,
            message: 'Access Forbidden: You are not authorized to view records for this student.'
          });
        }
      } else if (user.role === ROLES.HOD) {
        const Faculty = mongoose.model('Faculty');
        const hodProfile = await Faculty.findOne({ user: user._id });
        if (hodProfile && hodProfile.department?.toString() !== student.department?._id?.toString()) {
          return sendError(res, {
            statusCode: HTTP_STATUS.FORBIDDEN,
            message: 'Access Forbidden: Student does not belong to your department.'
          });
        }
      }
    }

    const studentId = student._id;

    // Parallel retrieval of related domains
    const [
      attendanceRecords,
      resultRecords,
      invoices,
      payments,
      libraryLoans,
      libraryFines,
      transportAllocation
    ] = await Promise.all([
      Attendance.find({ student: studentId })
        .populate('subject', 'name code')
        .populate('faculty', 'name')
        .sort({ date: -1 })
        .limit(100)
        .lean()
        .catch(() => []),
      Result.find({ student: studentId })
        .populate('examination', 'name examType academicYear semester')
        .populate('subject', 'name code credits')
        .sort({ createdAt: -1 })
        .lean()
        .catch(() => []),
      Invoice.find({ student: studentId })
        .sort({ issueDate: -1 })
        .lean()
        .catch(() => []),
      Payment.find({ student: studentId })
        .sort({ paymentDate: -1 })
        .lean()
        .catch(() => []),
      BookIssue ? BookIssue.find({ 'member.user': student.user?._id, status: { $in: ['issued', 'renewed', 'returned'] } })
        .populate('book', 'title author isbn')
        .sort({ issueDate: -1 })
        .limit(20)
        .lean()
        .catch(() => []) : Promise.resolve([]),
      LibraryFine ? LibraryFine.find({ 'member.user': student.user?._id })
        .sort({ createdAt: -1 })
        .lean()
        .catch(() => []) : Promise.resolve([]),
      StudentTransportAllocation ? StudentTransportAllocation.findOne({ student: studentId, status: 'allocated' })
        .populate('bus', 'busNumber registrationNumber make model capacity')
        .populate('route', 'routeName routeNumber source destination stops')
        .lean()
        .catch(() => null) : Promise.resolve(null)
    ]);

    const attList = Array.isArray(attendanceRecords) ? attendanceRecords : [];
    const resList = Array.isArray(resultRecords) ? resultRecords : [];
    const invList = Array.isArray(invoices) ? invoices : [];
    const payList = Array.isArray(payments) ? payments : [];
    const loanList = Array.isArray(libraryLoans) ? libraryLoans : [];
    const fineList = Array.isArray(libraryFines) ? libraryFines : [];

    // 1. Compute Attendance Analytics
    const totalClasses = attList.length;
    const presentClasses = attList.filter((a) => a.status === 'present').length;
    const absentClasses = attList.filter((a) => a.status === 'absent').length;
    const lateClasses = attList.filter((a) => a.status === 'late').length;
    const attendancePercentage = totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : 100;

    const subjectMap = {};
    attList.forEach((rec) => {
      const sId = rec.subject?._id?.toString() || 'unknown';
      if (!subjectMap[sId]) {
        subjectMap[sId] = {
          subjectName: rec.subject?.name || 'General Subject',
          subjectCode: rec.subject?.code || '',
          total: 0,
          present: 0
        };
      }
      subjectMap[sId].total += 1;
      if (rec.status === 'present') subjectMap[sId].present += 1;
    });

    const subjectAttendance = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(1)) : 0
    }));

    // 2. Compute Examination & Academic Results
    const totalMarksScored = resList.reduce((acc, curr) => acc + (Number(curr.totalMarks) || 0), 0);
    const averageMarks = resList.length > 0 ? Number((totalMarksScored / resList.length).toFixed(1)) : null;
    const failedCount = resList.filter((r) => r.status === 'failed' || r.grade === 'F' || r.grade === 'AB').length;

    // 3. Compute Fee Balances
    const totalInvoiced = invList.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
    const totalPaid = payList
      .filter((p) => p.status === 'completed' || p.status === 'successful' || p.status === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.amountPaid || curr.amount) || 0), 0);
    const pendingBalance = Math.max(0, totalInvoiced - totalPaid);

    // 4. Compute Library Summary
    const activeLibraryLoans = loanList.filter((l) => l.status === 'issued' || l.status === 'renewed');
    const unpaidFines = fineList.filter((f) => f.status === 'unpaid').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // 5. Academic Standing
    let standing = 'Satisfactory';
    if (attendancePercentage < 65 || failedCount >= 2) {
      standing = 'At-Risk';
    } else if (attendancePercentage >= 85 && (averageMarks === null || averageMarks >= 75) && failedCount === 0) {
      standing = 'Exemplary';
    }

    return sendSuccess(res, {
      message: 'Student 360° Profile retrieved successfully',
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
          courseCode: student.course?.code || '',
          semester: student.currentSemester,
          batchYear: student.batchYear,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          bloodGroup: student.bloodGroup,
          admissionStatus: student.admissionStatus,
          standing
        },
        attendance: {
          totalClasses,
          presentClasses,
          absentClasses,
          lateClasses,
          percentage: attendancePercentage,
          subjectBreakdown: subjectAttendance,
          recentRecords: attList.slice(0, 10).map((r) => ({
            id: r._id,
            date: r.date,
            status: r.status,
            subject: r.subject?.name,
            period: r.periodNumber
          }))
        },
        academics: {
          resultsCount: resList.length,
          averageScore: averageMarks,
          failedCount,
          recentResults: resList.map((r) => ({
            id: r._id,
            examTitle: r.examination?.name || 'Semester Exam',
            academicYear: r.examination?.academicYear,
            semester: r.examination?.semester,
            subject: r.subject?.name || 'Subject',
            subjectCode: r.subject?.code,
            marks: r.totalMarks,
            grade: r.grade,
            status: r.status
          }))
        },
        finances: {
          totalInvoiced,
          totalPaid,
          pendingBalance,
          invoiceCount: invList.length,
          recentPayments: payList.slice(0, 10).map((p) => ({
            id: p._id,
            receiptNumber: p.receiptNumber || `RCP-${p._id.toString().slice(-6)}`,
            amount: p.amountPaid || p.amount,
            method: p.paymentMethod || 'Online',
            date: p.paymentDate || p.createdAt,
            status: p.status
          }))
        },
        library: {
          activeLoanCount: activeLibraryLoans.length,
          unpaidFines,
          activeLoans: activeLibraryLoans.map((l) => ({
            id: l._id,
            bookTitle: l.book?.title || 'Library Book',
            author: l.book?.author,
            issueDate: l.issueDate,
            dueDate: l.dueDate
          }))
        },
        transport: transportAllocation
          ? {
              isAllocated: true,
              busNumber: transportAllocation.bus?.busNumber || 'N/A',
              registrationNumber: transportAllocation.bus?.registrationNumber || 'N/A',
              routeName: transportAllocation.route?.routeName || 'Campus Transit Route',
              pickupStop: transportAllocation.pickupStop || 'Main Gate',
              dropStop: transportAllocation.dropStop || 'Campus Terminal',
              status: transportAllocation.status
            }
          : {
              isAllocated: false,
              message: 'No institutional bus transit currently allocated'
            }
      }
    });
  } catch (error) {
    logger.error('Error generating student 360 profile:', error);
    next(error);
  }
}

module.exports = {
  getStudent360
};
