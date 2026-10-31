const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const env = require('../config/env');
const { ROLES, USER_STATUS } = require('@college-erp/shared');

const User = require('../modules/auth/auth.model');
const Faculty = require('../modules/faculty/faculty.model');
const Department = require('../modules/departments/department.model');
const Leave = require('../modules/leave/leave.model');
const {
  BookCategory,
  Book,
  BookCopy,
  LibraryMember,
  LibrarySetting
} = require('../modules/library/models');

async function runFixes() {
  console.log(`Connecting to MongoDB Atlas: ${env.MONGODB_URI}`);
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected successfully.');

  // 1. Upsert librarian@college.edu with password 'Library@2026#'
  console.log('--- 1. Upserting Librarian Account ---');
  let librarian = await User.findOne({ email: 'librarian@college.edu' });
  if (librarian) {
    librarian.name = 'Mrs. Evelyn Reed';
    librarian.role = ROLES.LIBRARIAN;
    librarian.department = 'Central Library';
    librarian.status = USER_STATUS.ACTIVE;
    librarian.password = 'Library@2026#';
    await librarian.save();
    console.log('Updated existing librarian account:', librarian.email);
  } else {
    librarian = await User.create({
      name: 'Mrs. Evelyn Reed',
      email: 'librarian@college.edu',
      password: 'Library@2026#',
      role: ROLES.LIBRARIAN,
      department: 'Central Library',
      status: USER_STATUS.ACTIVE
    });
    console.log('Created new librarian account:', librarian.email);
  }

  // 2. Seed Central Library Catalog, Settings and Members
  console.log('--- 2. Seeding Central Library Catalog & Settings ---');
  let defaultSetting = await LibrarySetting.findOne({ isDefault: true });
  if (!defaultSetting) {
    defaultSetting = await LibrarySetting.create({
      finePerDay: 5,
      defaultLoanPeriodDays: 14,
      facultyLoanPeriodDays: 30,
      maxBooksAllowedStudent: 3,
      maxBooksAllowedFaculty: 6,
      maxRenewalsAllowed: 2,
      isDefault: true
    });
    console.log('Created default LibrarySetting');
  } else {
    console.log('LibrarySetting already exists');
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

  const catEce = await BookCategory.findOneAndUpdate(
    { code: 'ECE-03' },
    { name: 'Electronics & Communication', code: 'ECE-03', description: 'Digital Signal Processing, VLSI and Telecom' },
    { upsert: true, new: true }
  );
  console.log('Categories upserted:', [catCse.code, catAi.code, catEce.code]);

  const book1 = await Book.findOneAndUpdate(
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

  const book2 = await Book.findOneAndUpdate(
    { isbn: '978-0262033848' },
    {
      title: 'Introduction to Algorithms (CLRS)',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      isbn: '978-0262033848',
      publisher: 'MIT Press',
      publicationYear: 2009,
      edition: '3rd Edition',
      category: catCse._id,
      shelfLocation: 'Stack A-02',
      totalCopies: 5,
      availableCopies: 5,
      status: 'active'
    },
    { upsert: true, new: true }
  );

  const book3 = await Book.findOneAndUpdate(
    { isbn: '978-0133594140' },
    {
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell, Peter Norvig',
      isbn: '978-0133594140',
      publisher: 'Pearson',
      publicationYear: 2020,
      edition: '4th Edition',
      category: catAi._id,
      shelfLocation: 'Stack B-01',
      totalCopies: 3,
      availableCopies: 3,
      status: 'active'
    },
    { upsert: true, new: true }
  );
  console.log('Books upserted:', [book1.title, book2.title, book3.title]);

  // Ensure book copies exist
  for (const b of [book1, book2, book3]) {
    const copyCount = await BookCopy.countDocuments({ book: b._id });
    if (copyCount === 0) {
      for (let i = 1; i <= b.totalCopies; i++) {
        await BookCopy.create({
          book: b._id,
          accessionNumber: `LIB-${b.isbn.slice(-4)}-00${i}`,
          copyNumber: i,
          status: 'available',
          condition: 'good',
          shelfLocation: b.shelfLocation
        });
      }
    }
  }

  // Ensure student library member exists
  const student = await User.findOne({ email: 'student.aarav@college.edu' });
  if (student) {
    await LibraryMember.findOneAndUpdate(
      { user: student._id },
      {
        user: student._id,
        name: student.name,
        email: student.email,
        role: 'student',
        department: student.department,
        rollNumber: 'CS2023001',
        membershipCardNumber: 'LIB-STU-0001',
        maxBooksAllowed: 3,
        status: 'active'
      },
      { upsert: true }
    );
    console.log('Library member enrolled:', student.email);
  }

  // 3. Upsert Pending Leaves LV-101, LV-102, LV-103
  console.log('--- 3. Upserting Pending Leaves LV-101, LV-102, LV-103 ---');
  const facultyTuring = await Faculty.findOne({ employeeId: 'FAC-CSE-001' }).populate('department');
  const faculty01 = await Faculty.findOne({ employeeId: 'FAC-CSE-002' }).populate('department');
  const facultyShannon = await Faculty.findOne({ employeeId: 'FAC-ECE-001' }).populate('department');

  if (facultyTuring) {
    const lv101 = await Leave.findOneAndUpdate(
      { applicationId: 'LV-101' },
      {
        applicationId: 'LV-101',
        faculty: facultyTuring._id,
        user: facultyTuring.user,
        department: facultyTuring.department?._id || facultyTuring.department,
        leaveType: 'duty',
        startDate: new Date('2026-11-05'),
        endDate: new Date('2026-11-08'),
        reason: 'Keynote Speaker at IEEE International Computing Conference',
        status: 'pending'
      },
      { upsert: true, new: true }
    );
    console.log('LV-101 upserted with status:', lv101.status);
  }

  if (faculty01) {
    const lv102 = await Leave.findOneAndUpdate(
      { applicationId: 'LV-102' },
      {
        applicationId: 'LV-102',
        faculty: faculty01._id,
        user: faculty01.user,
        department: faculty01.department?._id || faculty01.department,
        leaveType: 'sick',
        startDate: new Date('2026-11-02'),
        endDate: new Date('2026-11-04'),
        reason: 'Scheduled diagnostic surgery recovery',
        status: 'pending'
      },
      { upsert: true, new: true }
    );
    console.log('LV-102 upserted with status:', lv102.status);
  }

  if (facultyShannon) {
    const lv103 = await Leave.findOneAndUpdate(
      { applicationId: 'LV-103' },
      {
        applicationId: 'LV-103',
        faculty: facultyShannon._id,
        user: facultyShannon.user,
        department: facultyShannon.department?._id || facultyShannon.department,
        leaveType: 'casual',
        startDate: new Date('2026-11-10'),
        endDate: new Date('2026-11-14'),
        reason: 'Personal family obligations',
        status: 'pending'
      },
      { upsert: true, new: true }
    );
    console.log('LV-103 upserted with status:', lv103.status);
  }

  console.log('Database fixes and seeding completed successfully!');
  await mongoose.disconnect();
}

runFixes().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
