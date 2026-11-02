/**
 * Institutional Development Seed Script
 * Populates sample development data for a single engineering college (<1,000 students)
 * SAFETY: Only executes in non-production environments!
 */
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore DNS config failure if restricted
}

const mongoose = require('mongoose');
const env = require('../config/env');
const {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  TransportSetting
} = require('../modules/transport/models');
const { ROLES, USER_STATUS } = require('@college-erp/shared');

const User = require('../modules/auth/auth.model');
const Department = require('../modules/departments/department.model');
const Course = require('../modules/courses/course.model');
const Subject = require('../modules/subjects/subject.model');
const Student = require('../modules/students/student.model');
const Faculty = require('../modules/faculty/faculty.model');
const FeeStructure = require('../modules/fees/fee.model');
const Notice = require('../modules/notices/notice.model');
const Leave = require('../modules/leave/leave.model');
const {
  BookCategory,
  Book,
  BookCopy,
  LibraryMember,
  LibrarySetting
} = require('../modules/library/models');

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
    Notice.deleteMany({}),
    Leave.deleteMany({})
  ]);

  console.log('[Seed] Creating institutional users with role-based credentials...');
  const commonPassword = process.env.SEED_COMMON_PASSWORD || 'Password123!';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  // Helper to prevent duplicate user creation when seed script runs more than once
  async function upsertUser(userData) {
    const cleanEmail = userData.email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      existingUser.name = userData.name;
      existingUser.role = userData.role;
      existingUser.department = userData.department;
      existingUser.status = userData.status || USER_STATUS.ACTIVE;
      if (userData.password) {
        existingUser.password = userData.password;
      }
      await existingUser.save();
      return existingUser;
    }
    return await User.create({ ...userData, email: cleanEmail });
  }

  // 1. Create Core Users matching prompt guidelines and test suites
  const adminUser = await upsertUser({
    name: 'Dr. Arthur Mitchell',
    email: 'admin@college.edu',
    password: adminPassword,
    role: ROLES.SUPER_ADMIN,
    department: 'Administration',
    status: USER_STATUS.ACTIVE
  });

  const superAdminUser = await upsertUser({
    name: 'Super Administrator',
    email: 'superadmin@college.edu',
    password: adminPassword,
    role: ROLES.SUPER_ADMIN,
    department: 'System Governance',
    status: USER_STATUS.ACTIVE
  });

  const principalUser = await upsertUser({
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    password: commonPassword,
    role: ROLES.PRINCIPAL,
    department: 'Academic Council',
    status: USER_STATUS.ACTIVE
  });

  const hodCseUser = await upsertUser({
    name: 'Prof. David Kumar',
    email: 'hod.cse@college.edu',
    password: commonPassword,
    role: ROLES.HOD,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const hodEceUser = await upsertUser({
    name: 'Prof. Sarah Jenkins',
    email: 'hod.ece@college.edu',
    password: commonPassword,
    role: ROLES.HOD,
    department: 'Electronics & Communication Engineering',
    status: USER_STATUS.ACTIVE
  });

  const facultyUser1 = await upsertUser({
    name: 'Dr. Alan Turing',
    email: 'faculty.turing@college.edu',
    password: commonPassword,
    role: ROLES.FACULTY,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const facultyUser2 = await upsertUser({
    name: 'Prof. Rajesh Iyer',
    email: 'faculty01@college.edu',
    password: commonPassword,
    role: ROLES.FACULTY,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const facultyUser3 = await upsertUser({
    name: 'Dr. Claude Shannon',
    email: 'faculty.shannon@college.edu',
    password: commonPassword,
    role: ROLES.FACULTY,
    department: 'Electronics & Communication Engineering',
    status: USER_STATUS.ACTIVE
  });


  const accountsUser = await upsertUser({
    name: 'Mr. Robert Sterling',
    email: 'accounts@college.edu',
    password: commonPassword,
    role: ROLES.ACCOUNTS,
    department: 'Finance & Accounts',
    status: USER_STATUS.ACTIVE
  });

  const studentUser1 = await upsertUser({
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    password: commonPassword,
    role: ROLES.STUDENT,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const studentUser2 = await upsertUser({
    name: 'Rohan Gupta',
    email: 'student01@college.edu',
    password: commonPassword,
    role: ROLES.STUDENT,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });

  const studentUser3 = await upsertUser({
    name: 'Priya Patel',
    email: 'student.priya@college.edu',
    password: commonPassword,
    role: ROLES.STUDENT,
    department: 'Electronics & Communication Engineering',
    status: USER_STATUS.ACTIVE
  });

  const librarianUser = await upsertUser({
    name: 'Mrs. Evelyn Reed',
    email: 'librarian@college.edu',
    password: process.env.SEED_LIBRARIAN_PASSWORD || 'Library@2026#',
    role: ROLES.LIBRARIAN,
    department: 'Central Library',
    status: USER_STATUS.ACTIVE
  });

  const transportUser = await upsertUser({
    name: 'Mr. Robert Hayes',
    email: 'transport@college.edu',
    password: process.env.SEED_TRANSPORT_PASSWORD || commonPassword,
    role: ROLES.TRANSPORT_ADMIN,
    department: 'Transport & Logistics',
    status: USER_STATUS.ACTIVE
  });

  const libraryStaffUser = await upsertUser({
    name: 'Mr. Marcus Cole',
    email: 'librarystaff@college.edu',
    password: process.env.SEED_LIBRARY_STAFF_PASSWORD || 'Password123!',
    role: ROLES.LIBRARY_STAFF,
    department: 'Central Library',
    status: USER_STATUS.ACTIVE
  });
  // Sample Disabled Account for status enforcement testing
  const disabledUser = await upsertUser({
    name: 'Disabled User Demo',
    email: 'disabled.user@college.edu',
    password: commonPassword,
    role: ROLES.STUDENT,
    department: 'Mechanical Engineering',
    status: USER_STATUS.DISABLED
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
  await Faculty.create({
    user: facultyUser1._id,
    employeeId: 'FAC-CSE-001',
    department: cseDept._id,
    designation: 'Professor',
    qualification: 'Ph.D. in Computer Science',
    specialization: 'Algorithms & Distributed Systems'
  });

  await Faculty.create({
    user: facultyUser2._id,
    employeeId: 'FAC-CSE-002',
    department: cseDept._id,
    designation: 'Assistant Professor',
    qualification: 'M.Tech in Computer Engineering',
    specialization: 'Software Engineering'
  });

  await Faculty.create({
    user: facultyUser3._id,
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
    rollNumber: '24CSE001',
    enrollmentNumber: 'EN20240001',
    department: cseDept._id,
    course: btechCse._id,
    currentSemester: 3,
    batchYear: '2024-2028',
    guardianName: 'Anil Gupta',
    guardianPhone: '+91 98765 43219'
  });

  await Student.create({
    user: studentUser3._id,
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


  
  console.log('[Seed] Seeding sample faculty leave applications...');
  await Leave.create([
    {
      applicationId: 'LV-101',
      faculty: facultyUser1._id,
      user: facultyUser1._id,
      department: cseDept._id,
      leaveType: 'duty',
      startDate: new Date('2026-11-05'),
      endDate: new Date('2026-11-08'),
      reason: 'Keynote Speaker at IEEE International Computing Conference',
      status: 'pending'
    },
    {
      applicationId: 'LV-102',
      faculty: facultyUser2._id,
      user: facultyUser2._id,
      department: cseDept._id,
      leaveType: 'sick',
      startDate: new Date('2026-11-02'),
      endDate: new Date('2026-11-04'),
      reason: 'Scheduled diagnostic surgery recovery',
      status: 'pending'
    },
    {
      applicationId: 'LV-103',
      faculty: facultyUser3._id,
      user: facultyUser3._id,
      department: eceDept._id,
      leaveType: 'casual',
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-14'),
      reason: 'Personal family obligations',
      status: 'pending'
    }
  ]);

  console.log('[Seed] Seeding Central Library initial catalog & settings...');
  try {
    let defaultSetting = await LibrarySetting.findOne({ isDefault: true });
    if (!defaultSetting) {
      await LibrarySetting.create({
        finePerDay: 5,
        defaultLoanPeriodDays: 14,
        facultyLoanPeriodDays: 30,
        maxBooksAllowedStudent: 3,
        maxBooksAllowedFaculty: 6,
        maxRenewalsAllowed: 2,
        isDefault: true
      });
    }

    const catCse = await BookCategory.findOneAndUpdate(
      { code: 'CSE-01' },
      { name: 'Computer Science & Engineering', code: 'CSE-01', description: 'Core CS and Software Engineering' },
      { upsert: true, new: true }
    );

    const catAi = await BookCategory.findOneAndUpdate(
      { code: 'AI-02' },
      { name: 'Artificial Intelligence & ML', code: 'AI-02', description: 'Deep learning, neural networks and algorithms' },
      { upsert: true, new: true }
    );

    const sampleBook1 = await Book.findOneAndUpdate(
      { isbn: '978-0131103627' },
      {
        title: 'The C Programming Language',
        author: 'Brian W. Kernighan, Dennis M. Ritchie',
        isbn: '978-0131103627',
        publisher: 'Prentice Hall',
        publicationYear: 1988,
        edition: '2nd Edition',
        category: catCse._id,
        shelfLocation: 'Stack A-01',
        totalCopies: 4,
        availableCopies: 4,
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // Create copies for sampleBook1 if not exist
    const copyCount = await BookCopy.countDocuments({ book: sampleBook1._id });
    if (copyCount === 0) {
      for (let i = 1; i <= 4; i++) {
        await BookCopy.create({
          book: sampleBook1._id,
          accessionNumber: `LIB-2025-000${i}`,
          copyNumber: i,
          status: 'available',
          condition: 'good',
          shelfLocation: 'Stack A-01'
        });
      }
    }

    // Enroll sample student member
    if (studentUser1) {
      await LibraryMember.findOneAndUpdate(
        { user: studentUser1._id },
        {
          user: studentUser1._id,
          name: studentUser1.name,
          email: studentUser1.email,
          role: 'student',
          department: studentUser1.department,
          rollNumber: 'CS2023001',
          membershipCardNumber: 'LIB-STU-0001',
          maxBooksAllowed: 3,
          status: 'active'
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('[Seed] Non-fatal error seeding library catalog:', err.message);
  }


  console.log('[Seed] Seeding Transport Management System initial data...');
  try {
    let transportSetting = await TransportSetting.findOne({ isDefault: true });
    if (!transportSetting) {
      transportSetting = await TransportSetting.create({
        academicYear: '2025-2026',
        transportWorkingStatus: 'operational',
        defaultMorningPickup: '07:00 AM',
        defaultEveningDrop: '05:00 PM',
        maxSeatThresholdPercentage: 100,
        emergencyContactPhone: '+91 98765 43210',
        transportHelplineEmail: 'transport@college.edu',
        isDefault: true
      });
    }

    const driver1 = await Driver.findOneAndUpdate(
      { driverId: 'DRV-01' },
      {
        driverId: 'DRV-01',
        fullName: 'Rajesh Kumar',
        staffType: 'driver',
        phoneNumber: '+91 98450 11223',
        email: 'rajesh.driver@college.edu',
        address: '12th Cross, Malleshwaram, Bangalore',
        drivingLicenceNumber: 'DL-KA-2015-001234',
        licenceType: 'heavy_transport',
        licenceExpiryDate: new Date('2028-12-31'),
        employmentStatus: 'active',
        availabilityStatus: 'available'
      },
      { upsert: true, new: true }
    );

    const driver2 = await Driver.findOneAndUpdate(
      { driverId: 'DRV-02' },
      {
        driverId: 'DRV-02',
        fullName: 'Suresh Patil',
        staffType: 'driver',
        phoneNumber: '+91 98450 44556',
        email: 'suresh.driver@college.edu',
        address: '8th Main, Indiranagar, Bangalore',
        drivingLicenceNumber: 'DL-KA-2017-005678',
        licenceType: 'heavy_transport',
        licenceExpiryDate: new Date('2027-08-15'),
        employmentStatus: 'active',
        availabilityStatus: 'available'
      },
      { upsert: true, new: true }
    );

    const bus1 = await Bus.findOneAndUpdate(
      { busId: 'BUS-01' },
      {
        busId: 'BUS-01',
        registrationNumber: 'KA-01-AB-1234',
        busName: 'Campus Express 1',
        manufacturer: 'Tata Motors',
        model: 'Starbus Ultra',
        manufacturingYear: 2022,
        busType: 'standard',
        fuelType: 'diesel',
        seatingCapacity: 42,
        currentStatus: 'active',
        insuranceNumber: 'POL-2024-998811',
        insuranceExpiryDate: new Date('2027-06-30'),
        fitnessCertificateNumber: 'FIT-2024-5544',
        fitnessExpiryDate: new Date('2027-05-15'),
        assignedDriver: driver1._id
      },
      { upsert: true, new: true }
    );

    const bus2 = await Bus.findOneAndUpdate(
      { busId: 'BUS-02' },
      {
        busId: 'BUS-02',
        registrationNumber: 'KA-01-CD-5678',
        busName: 'Campus Express 2',
        manufacturer: 'Ashok Leyland',
        model: 'Viking',
        manufacturingYear: 2023,
        busType: 'deluxe',
        fuelType: 'cng',
        seatingCapacity: 50,
        currentStatus: 'active',
        insuranceNumber: 'POL-2024-998822',
        insuranceExpiryDate: new Date('2027-09-30'),
        fitnessCertificateNumber: 'FIT-2024-5545',
        fitnessExpiryDate: new Date('2027-08-20'),
        assignedDriver: driver2._id
      },
      { upsert: true, new: true }
    );

    const bus3 = await Bus.findOneAndUpdate(
      { busId: 'BUS-03' },
      {
        busId: 'BUS-03',
        registrationNumber: 'KA-01-EF-9012',
        busName: 'Campus Mini 1',
        manufacturer: 'Force Motors',
        model: 'Traveller 3050',
        manufacturingYear: 2021,
        busType: 'mini',
        fuelType: 'diesel',
        seatingCapacity: 25,
        currentStatus: 'under_maintenance',
        remarks: 'Scheduled 50,000 km brake overhaul'
      },
      { upsert: true, new: true }
    );

    const route1 = await Route.findOneAndUpdate(
      { routeCode: 'R-NC-101' },
      {
        routeId: 'RT-01',
        routeName: 'North City Express',
        routeCode: 'R-NC-101',
        startingPoint: 'City Railway Station',
        destination: 'Apex Engineering College Campus',
        totalDistance: 28,
        estimatedDuration: '45 mins',
        assignedBus: bus1._id,
        assignedDriver: driver1._id,
        routeStatus: 'active',
        stops: [
          {
            stopId: 'ST-01',
            stopName: 'City Railway Station',
            stopAddress: 'Platform 1 Main Entry',
            stopSequence: 1,
            pickupTime: '07:00 AM',
            dropTime: '05:45 PM'
          },
          {
            stopId: 'ST-02',
            stopName: 'Majestic Metro Interchange',
            stopAddress: 'Gubbi Thotadappa Road',
            stopSequence: 2,
            pickupTime: '07:15 AM',
            dropTime: '05:30 PM'
          },
          {
            stopId: 'ST-03',
            stopName: 'Hebbal Flyover Junction',
            stopAddress: 'Bellary Road Hebbal',
            stopSequence: 3,
            pickupTime: '07:35 AM',
            dropTime: '05:10 PM'
          },
          {
            stopId: 'ST-04',
            stopName: 'Yelahanka Satellite Town',
            stopAddress: 'NES Bus Stop Yelahanka',
            stopSequence: 4,
            pickupTime: '07:55 AM',
            dropTime: '04:50 PM'
          },
          {
            stopId: 'ST-05',
            stopName: 'Apex Campus Gate 1',
            stopAddress: 'College Main Campus Entrance',
            stopSequence: 5,
            pickupTime: '08:15 AM',
            dropTime: '04:30 PM'
          }
        ]
      },
      { upsert: true, new: true }
    );

    // Link route back to bus
    await Bus.findByIdAndUpdate(bus1._id, { assignedRoute: route1._id });

    // Link sample student transport allocation
    const sampleStudent = await Student.findOne({ rollNumber: 'CS2023001' }).populate('user');
    if (sampleStudent) {
      await StudentTransportAllocation.findOneAndUpdate(
        { student: sampleStudent._id },
        {
          allocationId: 'STA-2026-0001',
          student: sampleStudent._id,
          user: sampleStudent.user?._id,
          studentName: sampleStudent.user?.name || 'Aarav Sharma',
          rollNumber: sampleStudent.rollNumber,
          department: 'Computer Science & Engineering',
          academicYear: '2025-2026',
          guardianName: sampleStudent.guardianName || 'Rajesh Sharma',
          guardianPhone: sampleStudent.guardianPhone || '+91 98765 11223',
          bus: bus1._id,
          route: route1._id,
          pickupStop: 'Hebbal Flyover Junction',
          dropStop: 'Hebbal Flyover Junction',
          pickupTime: '07:35 AM',
          dropTime: '05:10 PM',
          allocationDate: new Date(),
          allocationStatus: 'active',
          transportFeeStatus: 'paid'
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('[Seed] Non-fatal error seeding transport data:', err.message);
  }

  console.log('\n======================================================');
  console.log(' SEED DATA COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log(' Institutional Demo Logins:');
  console.log(' Super Admin password:  ' + adminPassword);
  console.log(' All other users password: ' + commonPassword + '\n');
  console.log(' 1. Super Admin:  superadmin@college.edu (or admin@college.edu)');
  console.log(' 2. Principal:    principal@college.edu');
  console.log(' 3. HOD (CSE):    hod.cse@college.edu');
  console.log(' 4. HOD (ECE):    hod.ece@college.edu');
  console.log(' 5. Faculty CSE:  faculty01@college.edu (or faculty.turing@college.edu)');
  console.log(' 6. Student CSE:  student01@college.edu (or student.aarav@college.edu)');
  console.log(' 7. Accounts:     accounts@college.edu');
  console.log(' 8. Librarian:     librarian@college.edu');
  console.log(' 9. Library Staff: librarystaff@college.edu');
  console.log('10. Transport Admin: transport@college.edu');
  console.log('11. Disabled Demo: disabled.user@college.edu (status: disabled)');
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
