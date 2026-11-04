/**
 * Master Demo Data Orchestrator
 * CLI Usage:
 *   node src/scripts/demo-seed/index.js --seed     (Seed entire demo college dataset)
 *   node src/scripts/demo-seed/index.js --clean    (Clean only demo-tagged records)
 *   node src/scripts/demo-seed/index.js --verify   (Audit demo records in database)
 */
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { connectDB } = require('../../config/db');
const env = require('../../config/env');

const { DEMO_PREFIX, DEMO_TAG, DEMO_DOMAIN, DEMO_PASSWORD, ROLES } = require('./config');
const { cleanDemoData } = require('./cleanDemo');
const { seedUsers } = require('./seedUsers');
const { seedAcademics } = require('./seedAcademics');
const { seedStudents } = require('./seedStudents');
const { seedAttendance } = require('./seedAttendance');
const { seedExaminations } = require('./seedExaminations');
const { seedFinance } = require('./seedFinance');
const { seedLibrary } = require('./seedLibrary');
const { seedTransport } = require('./seedTransport');
const { seedNotices } = require('./seedNotices');

// Models for verification
const User = require('../../modules/auth/auth.model');
const Department = require('../../modules/departments/department.model');
const Course = require('../../modules/courses/course.model');
const Subject = require('../../modules/subjects/subject.model');
const Faculty = require('../../modules/faculty/faculty.model');
const Student = require('../../modules/students/student.model');
const Timetable = require('../../modules/timetable/timetable.model');
const Attendance = require('../../modules/attendance/attendance.model');
const Exam = require('../../modules/examinations/exam.model');
const Result = require('../../modules/results/result.model');
const FeeStructure = require('../../modules/fees/fee.model');
const Payment = require('../../modules/payments/payment.model');
const Book = require('../../modules/library/models/book.model');
const BookCopy = require('../../modules/library/models/bookCopy.model');
const BookIssue = require('../../modules/library/models/issue.model');
const Bus = require('../../modules/transport/models/bus.model');
const Driver = require('../../modules/transport/models/driver.model');
const Route = require('../../modules/transport/models/route.model');
const StudentTransportAllocation = require('../../modules/transport/models/studentTransportAllocation.model');
const Trip = require('../../modules/transport/models/trip.model');
const Notice = require('../../modules/notices/notice.model');
const Notification = require('../../modules/notifications/notification.model');
const Leave = require('../../modules/leave/leave.model');

async function verifyDatabase() {
  console.log('\n======================================================');
  console.log('DEMO DATABASE RECORD POPULATION AUDIT');
  console.log('======================================================');

  const counts = {
    users: await User.countDocuments({ email: new RegExp(`@${DEMO_DOMAIN}$`, 'i') }),
    departments: await Department.countDocuments({ code: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    courses: await Course.countDocuments({ code: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    subjects: await Subject.countDocuments({ code: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    faculties: await Faculty.countDocuments({ employeeId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    students: await Student.countDocuments({ rollNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    timetables: await Timetable.countDocuments({ roomNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    attendance: await Attendance.countDocuments({ remarks: new RegExp('session|arrival|absence', 'i') }),
    exams: await Exam.countDocuments({ name: new RegExp(DEMO_TAG, 'i') }),
    results: await Result.countDocuments({ examination: { $in: (await Exam.find({ name: new RegExp(DEMO_TAG, 'i') }).select('_id')).map(e => e._id) } }),
    feeStructures: await FeeStructure.countDocuments({ title: new RegExp(DEMO_TAG, 'i') }),
    payments: await Payment.countDocuments({ receiptNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    books: await Book.countDocuments({ isbn: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    bookCopies: await BookCopy.countDocuments({ accessionNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    bookIssues: await BookIssue.countDocuments({ issueNumber: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    buses: await Bus.countDocuments({ busId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    drivers: await Driver.countDocuments({ driverId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    routes: await Route.countDocuments({ routeCode: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    transportAllocations: await StudentTransportAllocation.countDocuments({ allocationId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    trips: await Trip.countDocuments({ tripId: new RegExp(`^${DEMO_PREFIX}`, 'i') }),
    notices: await Notice.countDocuments({ title: new RegExp(DEMO_TAG, 'i') }),
    notifications: await Notification.countDocuments({ title: new RegExp(DEMO_TAG, 'i') }),
    leaves: await Leave.countDocuments({ reason: new RegExp(DEMO_TAG, 'i') })
  };

  console.table(Object.entries(counts).map(([module, count]) => ({ Module: module, 'Demo Records': count })));
  console.log('======================================================\n');
  return counts;
}

async function main() {
  const args = process.argv.slice(2);
  const doClean = args.includes('--clean');
  const doVerifyOnly = args.includes('--verify');

  console.log('[Orchestrator] Connecting to MongoDB...');
  await connectDB();
  const dbName = mongoose.connection.name;
  console.log(`[SAFE CHECK] Target database verified: "${dbName}"`);

  if (!dbName || (!dbName.includes('dev') && !dbName.includes('demo') && !dbName.includes('test'))) {
    throw new Error(`CRITICAL BLOCKED: Refusing operation on non-development database: "${dbName}"`);
  }

  if (doClean) {
    await cleanDemoData();
    await verifyDatabase();
    process.exit(0);
  }

  if (doVerifyOnly) {
    await verifyDatabase();
    process.exit(0);
  }

  console.log('\n======================================================');
  console.log('STARTING COMPLETE DEMO COLLEGE ERP DATA POPULATION');
  console.log('======================================================\n');

  // 1. Users (13 portal roles, 5 HODs, 20 faculty, 100 students, 100 parents, 20 transport crew)
  const userMap = await seedUsers();

  // 2. Academics (5 depts, 5 courses, 35 subjects, 20 faculty profiles, timetable, events)
  const academicMap = await seedAcademics(userMap);

  // 3. Students (100 student profiles linked to departments, courses, and parents)
  const studentProfiles = await seedStudents(userMap, academicMap);

  // 4. Attendance (200+ attendance records across subjects and dates)
  await seedAttendance(academicMap, studentProfiles);

  // 5. Examinations (Mid-Term & Semester-End exams, 120+ student scorecards)
  await seedExaminations(academicMap, studentProfiles);

  // 6. Finance & Accounts (Fee structures, 100 payments and receipts)
  await seedFinance(academicMap, studentProfiles);

  // 7. Library (Categories, 55 catalog books, copies, memberships, 50 circulation issues)
  await seedLibrary(userMap, academicMap, studentProfiles);

  // 8. Transport (10 buses, 10 routes, drivers, attendants, 100 allocations, 10 trips, telemetry)
  await seedTransport(userMap, studentProfiles);

  // 9. Notices, Notifications, and Leaves (35+ notices/notifications, 15 leave records)
  await seedNotices(userMap, academicMap);

  // 10. Write local demo credentials file
  const credsContent = [
    `# DEMO ENVIRONMENT CREDENTIALS (GIT-IGNORED)\n`,
    `DEMO_COMMON_PASSWORD=${DEMO_PASSWORD}\n`,
    `DEMO_SUPER_ADMIN_EMAIL=demo.admin@${DEMO_DOMAIN}`,
    `DEMO_PRINCIPAL_EMAIL=demo.principal@${DEMO_DOMAIN}`,
    `DEMO_HOD_CSE_EMAIL=demo.hod.cse@${DEMO_DOMAIN}`,
    `DEMO_FACULTY_EMAIL=demo.faculty01@${DEMO_DOMAIN}`,
    `DEMO_STUDENT_EMAIL=demo.student001@${DEMO_DOMAIN}`,
    `DEMO_ACCOUNTS_EMAIL=demo.accounts@${DEMO_DOMAIN}`,
    `DEMO_LIBRARIAN_EMAIL=demo.librarian@${DEMO_DOMAIN}`,
    `DEMO_LIBRARY_STAFF_EMAIL=demo.librarystaff@${DEMO_DOMAIN}`,
    `DEMO_TRANSPORT_ADMIN_EMAIL=demo.transportadmin@${DEMO_DOMAIN}`,
    `DEMO_TRANSPORT_SUPERVISOR_EMAIL=demo.supervisor@${DEMO_DOMAIN}`,
    `DEMO_BUS_DRIVER_EMAIL=demo.driver01@${DEMO_DOMAIN}`,
    `DEMO_BUS_ATTENDANT_EMAIL=demo.attendant01@${DEMO_DOMAIN}`,
    `DEMO_PARENT_EMAIL=demo.parent001@${DEMO_DOMAIN}\n`
  ].join('\n');

  const credsPath = path.resolve(__dirname, '../../../../../.demo-credentials.env');
  fs.writeFileSync(credsPath, credsContent, 'utf-8');
  console.log('[Orchestrator] Saved demo credentials to .demo-credentials.env (git-ignored).');

  // Verify
  await verifyDatabase();

  console.log('======================================================');
  console.log('DEMO DATA POPULATION COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL SEED ORCHESTRATOR ERROR:', err);
  process.exit(1);
});
