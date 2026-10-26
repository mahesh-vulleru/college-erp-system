/**
 * Institutional Development Seed Script
 * Populates sample development data for a single engineering college (<1,000 students)
 * SAFETY: Only executes in non-production environments!
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { ROLES, USER_STATUS } = require('@college-erp/shared');

const User = require('../modules/auth/auth.model');
const Department = require('../modules/departments/department.model');
const Course = require('../modules/courses/course.model');
const Subject = require('../modules/subjects/subject.model');
const Student = require('../modules/students/student.model');
const Faculty = require('../modules/faculty/faculty.model');
const FeeStructure = require('../modules/fees/fee.model');
const Notice = require('../modules/notices/notice.model');

async function seed() {
  if (env.NODE_ENV === 'production') {
    console.error('FATAL: Cannot run seed script in production!');
    process.exit(1);
  }

  console.log(`[Seed] Connecting to MongoDB: ${env.MONGODB_URI}`);
  await mongoose.connect(env.MONGODB_URI);

  console.log('[Seed] Clearing existing development data...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Course.deleteMany({}),
    Subject.deleteMany({}),
    Student.deleteMany({}),
    Faculty.deleteMany({}),
    FeeStructure.deleteMany({}),
    Notice.deleteMany({})
  ]);

  console.log('[Seed] Creating institutional users with role-based credentials...');
  const commonPassword = 'Password123!';

  // 1. Create Core Users
  const adminUser = await User.create({
    name: 'Dr. Arthur Mitchell',
    email: 'admin@college.edu',
    password: commonPassword,
    role: ROLES.SUPER_ADMIN,
    department: 'Administration',
    status: USER_STATUS.ACTIVE
  });

  const principalUser = await User.create({
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    password: commonPassword,
    role: ROLES.PRINCIPAL,
    department: 'Academic Council',
    status: USER_STATUS.ACTIVE
  });

  const hodCseUser = await User.create({
    name: 'Prof. David Kumar',
    email: 'hod.cse@college.edu',
    password: commonPassword,
    role: ROLES.HOD,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const hodEceUser = await User.create({
    name: 'Prof. Sarah Jenkins',
    email: 'hod.ece@college.edu',
    password: commonPassword,
    role: ROLES.HOD,
    department: 'Electronics & Communication Engineering',
    status: USER_STATUS.ACTIVE
  });

  const facultyUser1 = await User.create({
    name: 'Dr. Alan Turing',
    email: 'faculty.turing@college.edu',
    password: commonPassword,
    role: ROLES.FACULTY,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const facultyUser2 = await User.create({
    name: 'Dr. Claude Shannon',
    email: 'faculty.shannon@college.edu',
    password: commonPassword,
    role: ROLES.FACULTY,
    department: 'Electronics & Communication Engineering',
    status: USER_STATUS.ACTIVE
  });

  const accountsUser = await User.create({
    name: 'Mr. Robert Sterling',
    email: 'accounts@college.edu',
    password: commonPassword,
    role: ROLES.ACCOUNTS,
    department: 'Finance & Accounts',
    status: USER_STATUS.ACTIVE
  });

  const studentUser1 = await User.create({
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    password: commonPassword,
    role: ROLES.STUDENT,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const studentUser2 = await User.create({
    name: 'Priya Patel',
    email: 'student.priya@college.edu',
    password: commonPassword,
    role: ROLES.STUDENT,
    department: 'Electronics & Communication Engineering',
    status: USER_STATUS.ACTIVE
  });

  console.log('[Seed] Creating Academic Departments...');
  const cseDept = await Department.create({
    name: 'Computer Science & Engineering',
    code: 'CSE',
    hod: hodCseUser._id,
    intakeCapacity: 120,
    description: 'Department of Computer Science & Engineering'
  });

  const eceDept = await Department.create({
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    hod: hodEceUser._id,
    intakeCapacity: 90,
    description: 'Department of Electronics & Communication Engineering'
  });

  const meDept = await Department.create({
    name: 'Mechanical Engineering',
    code: 'ME',
    intakeCapacity: 60,
    description: 'Department of Mechanical Engineering'
  });

  const ceDept = await Department.create({
    name: 'Civil Engineering',
    code: 'CE',
    intakeCapacity: 60,
    description: 'Department of Civil Engineering'
  });

  console.log('[Seed] Creating B.Tech Degree Programs (Courses)...');
  const btechCse = await Course.create({
    name: 'Bachelor of Technology in Computer Science & Engineering',
    code: 'BTECH-CSE',
    department: cseDept._id,
    degreeType: 'B.Tech',
    durationSemesters: 8,
    totalCredits: 160
  });

  const btechEce = await Course.create({
    name: 'Bachelor of Technology in Electronics & Communication Engineering',
    code: 'BTECH-ECE',
    department: eceDept._id,
    degreeType: 'B.Tech',
    durationSemesters: 8,
    totalCredits: 160
  });

  console.log('[Seed] Creating Subjects for Semesters...');
  const subDsa = await Subject.create({
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    course: btechCse._id,
    department: cseDept._id,
    semester: 3,
    credits: 4
  });

  const subDbms = await Subject.create({
    name: 'Database Management Systems',
    code: 'CS302',
    course: btechCse._id,
    department: cseDept._id,
    semester: 3,
    credits: 4
  });

  const subSignals = await Subject.create({
    name: 'Signals & Systems',
    code: 'EC301',
    course: btechEce._id,
    department: eceDept._id,
    semester: 3,
    credits: 4
  });

  console.log('[Seed] Creating Faculty Profiles...');
  const facultyProfile1 = await Faculty.create({
    user: facultyUser1._id,
    employeeId: 'FAC-CSE-001',
    department: cseDept._id,
    designation: 'Professor',
    qualification: 'Ph.D. in Computer Science',
    specialization: 'Algorithms & Distributed Systems'
  });

  const facultyProfile2 = await Faculty.create({
    user: facultyUser2._id,
    employeeId: 'FAC-ECE-001',
    department: eceDept._id,
    designation: 'Associate Professor',
    qualification: 'Ph.D. in Information Theory',
    specialization: 'Digital Signal Processing'
  });

  console.log('[Seed] Creating Student Profiles...');
  await Student.create({
    user: studentUser1._id,
    rollNumber: '24CSE042',
    enrollmentNumber: 'EN20240042',
    department: cseDept._id,
    course: btechCse._id,
    currentSemester: 3,
    batchYear: '2024-2028',
    guardianName: 'Ramesh Sharma',
    guardianPhone: '+91 98765 43210'
  });

  await Student.create({
    user: studentUser2._id,
    rollNumber: '24ECE018',
    enrollmentNumber: 'EN20240018',
    department: eceDept._id,
    course: btechEce._id,
    currentSemester: 3,
    batchYear: '2024-2028',
    guardianName: 'Suresh Patel',
    guardianPhone: '+91 98765 43211'
  });

  console.log('[Seed] Creating Institutional Fee Structure...');
  await FeeStructure.create({
    title: 'B.Tech Semester 3 Academic Fee 2025-26',
    department: cseDept._id,
    academicYear: '2025-2026',
    semester: 3,
    tuitionFee: 40000,
    labFee: 6000,
    libraryFee: 2500,
    examFee: 1500,
    otherFee: 1000,
    totalAmount: 51000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  console.log('[Seed] Creating Notice Circulars...');
  await Notice.create({
    title: 'Mid-Term Examinations Schedule Announced',
    content: 'The first mid-term examinations for all B.Tech semesters will commence from next month. Check the examination portal for subject-wise slots.',
    targetRoles: ['*'],
    priority: 'normal',
    publishedBy: principalUser._id,
    isPinned: true
  });

  await Notice.create({
    title: 'Fee Payment Deadline for Odd Semesters',
    content: 'All students are requested to clear their semester dues before the 15th to avoid late fee penalties.',
    targetRoles: [ROLES.STUDENT, ROLES.ACCOUNTS],
    priority: 'urgent',
    publishedBy: accountsUser._id,
    isPinned: true
  });

  console.log('\n======================================================');
  console.log(' SEED DATA COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log(' Institutional Demo Logins:');
  console.log(' Password for all seed users: Password123!\n');
  console.log(' 1. Super Admin:  admin@college.edu');
  console.log(' 2. Principal:    principal@college.edu');
  console.log(' 3. HOD (CSE):    hod.cse@college.edu');
  console.log(' 4. HOD (ECE):    hod.ece@college.edu');
  console.log(' 5. Faculty CSE:  faculty.turing@college.edu');
  console.log(' 6. Student CSE:  student.aarav@college.edu');
  console.log(' 7. Accounts:     accounts@college.edu');
  console.log('======================================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}

module.exports = seed;

