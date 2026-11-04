/**
 * Safe Demo Data Cleanup Utility
 * Strictly removes ONLY records bearing the dedicated DEMO marker or demo email domain.
 * NEVER deletes or alters non-demo or real institutional records.
 */
const mongoose = require('mongoose');
const { DEMO_PREFIX, DEMO_TAG, DEMO_DOMAIN } = require('./config');

// Models
const User = require('../../modules/auth/auth.model');
const Department = require('../../modules/departments/department.model');
const Course = require('../../modules/courses/course.model');
const Subject = require('../../modules/subjects/subject.model');
const Faculty = require('../../modules/faculty/faculty.model');
const Student = require('../../modules/students/student.model');
const Attendance = require('../../modules/attendance/attendance.model');
const Timetable = require('../../modules/timetable/timetable.model');
const Leave = require('../../modules/leave/leave.model');
const Notice = require('../../modules/notices/notice.model');
const Exam = require('../../modules/examinations/exam.model');
const Result = require('../../modules/results/result.model');
const FeeStructure = require('../../modules/fees/fee.model');
const Payment = require('../../modules/payments/payment.model');
const Book = require('../../modules/library/models/book.model');
const BookCopy = require('../../modules/library/models/bookCopy.model');
const BookCategory = require('../../modules/library/models/category.model');
const BookIssue = require('../../modules/library/models/issue.model');
const LibraryMember = require('../../modules/library/models/member.model');
const Bus = require('../../modules/transport/models/bus.model');
const Driver = require('../../modules/transport/models/driver.model');
const Route = require('../../modules/transport/models/route.model');
const StudentTransportAllocation = require('../../modules/transport/models/studentTransportAllocation.model');
const Trip = require('../../modules/transport/models/trip.model');
const FuelRecord = require('../../modules/transport/models/fuelRecord.model');
const VehicleMaintenance = require('../../modules/transport/models/vehicleMaintenance.model');
const GpsLocation = require('../../modules/transport/models/gpsLocation.model');
const Notification = require('../../modules/notifications/notification.model');
const InstitutionalEvent = require('../../modules/events/institutionalEvent.model');

async function cleanDemoData() {
  const dbName = mongoose.connection.name;
  console.log(`[CLEAN CHECK] Connected to MongoDB database: "${dbName}"`);
  if (!dbName || (!dbName.includes('dev') && !dbName.includes('demo') && !dbName.includes('test'))) {
    throw new Error(`CRITICAL BLOCKED: Refusing to clean non-development database: "${dbName}"`);
  }

  console.log('[CLEAN] Deleting ONLY records with demo markers...');

  // 1. Find demo user IDs
  const demoUsers = await User.find({ email: new RegExp(`@${DEMO_DOMAIN}$`, 'i') }).select('_id');
  const demoUserIds = demoUsers.map(u => u._id);

  // 2. Find demo student & faculty IDs
  const demoStudents = await Student.find({ rollNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }).select('_id');
  const demoStudentIds = demoStudents.map(s => s._id);

  const demoFaculties = await Faculty.find({ employeeId: new RegExp(`^${DEMO_PREFIX}`, 'i') }).select('_id');
  const demoFacultyIds = demoFaculties.map(f => f._id);

  // 3. Find demo bus IDs
  const demoBuses = await Bus.find({ busId: new RegExp(`^${DEMO_PREFIX}`, 'i') }).select('_id');
  const demoBusIds = demoBuses.map(b => b._id);

  // 4. Find demo book IDs
  const demoBooks = await Book.find({ isbn: new RegExp(`^${DEMO_PREFIX}`, 'i') }).select('_id');
  const demoBookIds = demoBooks.map(b => b._id);

  // Delete matching demo records only
  const results = await Promise.all([
    Attendance.deleteMany({
      $or: [{ student: { $in: demoStudentIds } }, { faculty: { $in: demoFacultyIds } }]
    }),
    Result.deleteMany({ student: { $in: demoStudentIds } }),
    Exam.deleteMany({ name: new RegExp(DEMO_TAG, 'i') }),
    Payment.deleteMany({ receiptNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    FeeStructure.deleteMany({ title: new RegExp(DEMO_TAG, 'i') }),
    Timetable.deleteMany({ roomNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Subject.deleteMany({ code: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Course.deleteMany({ code: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Department.deleteMany({ code: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Leave.deleteMany({ reason: new RegExp(DEMO_TAG, 'i') }),
    Notice.deleteMany({ title: new RegExp(DEMO_TAG, 'i') }),
    Notification.deleteMany({ title: new RegExp(DEMO_TAG, 'i') }),
    InstitutionalEvent.deleteMany({ title: new RegExp(DEMO_TAG, 'i') }),
    BookIssue.deleteMany({ issueNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    BookCopy.deleteMany({ accessionNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    LibraryMember.deleteMany({ membershipNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Book.deleteMany({ _id: { $in: demoBookIds } }),
    BookCategory.deleteMany({ code: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    GpsLocation.deleteMany({ bus: { $in: demoBusIds } }),
    FuelRecord.deleteMany({ fuelRecordId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    VehicleMaintenance.deleteMany({ maintenanceId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Trip.deleteMany({ tripId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    StudentTransportAllocation.deleteMany({ allocationId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Route.deleteMany({ routeCode: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Driver.deleteMany({ driverId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    Bus.deleteMany({ _id: { $in: demoBusIds } }),
    Student.deleteMany({ _id: { $in: demoStudentIds } }),
    Faculty.deleteMany({ _id: { $in: demoFacultyIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } })
  ]);

  console.log('[CLEAN] Demo records cleanup completed successfully.');
}

module.exports = { cleanDemoData };
