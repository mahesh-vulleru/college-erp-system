/**
 * Seed Demo Library Management
 * Categories, 50+ Books, Physical Copies, Member profiles, and 50+ Circulation Issue/Return transactions
 */
const Book = require('../../modules/library/models/book.model');
const BookCopy = require('../../modules/library/models/bookCopy.model');
const BookCategory = require('../../modules/library/models/category.model');
const BookIssue = require('../../modules/library/models/issue.model');
const LibraryMember = require('../../modules/library/models/member.model');
const { DEMO_PREFIX, DEMO_TAG } = require('./config');

const CATEGORIES = [
  { name: 'Computer Science & Software', code: 'CS', desc: 'Software engineering, algorithms, architectures' },
  { name: 'Electronics & Communication', code: 'EC', desc: 'Circuits, signal processing, VLSI' },
  { name: 'Mechanical & Thermal Engineering', code: 'ME', desc: 'Thermodynamics, fluid mechanics, design' },
  { name: 'Civil & Structural Engineering', code: 'CE', desc: 'Structures, concrete, environmental' },
  { name: 'Electrical & Power Engineering', code: 'EE', desc: 'Power grids, machines, control systems' },
  { name: 'Engineering Mathematics & Sciences', code: 'MS', desc: 'Applied mathematics, physics, statistics' }
];

const BOOK_TITLES = [
  'Introduction to Algorithms (CLRS)', 'Computer Networks: A Systems Approach',
  'Operating System Concepts (Silberschatz)', 'Database System Concepts (Korth)',
  'Clean Architecture & Design Patterns', 'Artificial Intelligence: A Modern Approach',
  'Compilers: Principles, Techniques, and Tools', 'Design Patterns: Elements of Reusable Object-Oriented Software',
  'Computer Organization and Architecture (Stallings)', 'Modern Operating Systems (Tanenbaum)',
  'Microelectronic Circuits (Sedra & Smith)', 'Digital Signal Processing: Principles & Applications',
  'Signals and Systems (Oppenheim)', 'Semiconductor Physics and Devices',
  'Electromagnetic Waves and Radiating Systems', 'Linear Integrated Circuits & Applications',
  'VLSI Design Principles & CMOS Systems', 'Communication Systems (Haykin)',
  'Engineering Thermodynamics (Nag)', 'Fluid Mechanics (White)',
  'Heat and Mass Transfer (Incropera)', 'Shigley Mechanical Engineering Design',
  'Theory of Machines and Mechanisms', 'Manufacturing Engineering & Technology',
  'Internal Combustion Engines (Heywood)', 'Refrigeration and Air Conditioning',
  'Strength of Materials (Timoshenko)', 'Theory of Structures (Ramamrutham)',
  'Reinforced Concrete Design (Pillai & Menon)', 'Soil Mechanics and Foundations (Punmia)',
  'Surveying: Volume 1 & 2', 'Environmental Engineering (Peavy)',
  'Highway Engineering (Khanna & Justo)', 'Design of Steel Structures (Duggal)',
  'Electric Machinery Fundamentals (Chapman)', 'Modern Power System Analysis (Nagrath & Kothari)',
  'Power System Engineering', 'Automatic Control Systems (Kuo)',
  'Power Electronics: Converters & Applications (Rashid)', 'Electric Drives: Concepts & Applications',
  'High Voltage Engineering (Naidu)', 'Renewable Energy Technologies',
  'Advanced Engineering Mathematics (Kreyszig)', 'Higher Engineering Mathematics (Grewal)',
  'Probability and Statistics for Engineers', 'Linear Algebra and Its Applications (Strang)',
  'Numerical Methods for Scientific Computing', 'Discrete Mathematics and Its Applications (Rosen)',
  'Complex Variables and Applications (Churchill)', 'Optimization Techniques in Engineering',
  'Software Testing Principles & Practice', 'Modern Full-Stack QA Automation Patterns',
  'Site Reliability Engineering (Beyer et al.)', 'Continuous Delivery & DevOps Handbook',
  'Engineering Ethics & Professional Practice'
];

async function seedLibrary(userMap, academicMap, studentProfiles) {
  console.log('[Library] Seeding categories, 50+ catalog books, physical copies, and 50+ issue transactions...');

  // 1. Categories
  const categoryMap = {};
  for (const c of CATEGORIES) {
    const code = `${DEMO_PREFIX}CAT-${c.code}`;
    let cat = await BookCategory.findOne({ code });
    if (!cat) {
      cat = await BookCategory.create({
        name: `${c.name} ${DEMO_TAG}`,
        code,
        description: c.desc
      });
    }
    categoryMap[c.code] = cat;
  }

  // 2. Books & Book Copies
  const books = [];
  const copies = [];
  const catKeys = Object.keys(categoryMap);

  for (let i = 0; i < BOOK_TITLES.length; i++) {
    const title = `${BOOK_TITLES[i]} ${DEMO_TAG}`;
    const isbn = `${DEMO_PREFIX}ISBN-978-01-${String(i + 1).padStart(4, '0')}`;
    const catCode = catKeys[i % catKeys.length];
    const category = categoryMap[catCode];

    let book = await Book.findOne({ isbn });
    if (!book) {
      book = await Book.create({
        title,
        isbn,
        author: `Author Scholar ${i + 1}`,
        publisher: 'Academic Technical Press',
        edition: `${(i % 5) + 1}th Edition`,
        yearPublished: 2020 + (i % 5),
        category: category._id,
        department: catCode,
        totalCopies: 5,
        availableCopies: 4
      });
    }
    books.push(book);

    // Create 1 primary tracked copy per book
    const accessionNumber = `${DEMO_PREFIX}ACC-${String(i + 1).padStart(3, '0')}`;
    let copy = await BookCopy.findOne({ accessionNumber });
    if (!copy) {
      copy = await BookCopy.create({
        book: book._id,
        accessionNumber,
        barcode: `BAR-${accessionNumber}`,
        condition: 'good',
        status: i < 50 ? 'issued' : 'available'
      });
    }
    copies.push(copy);
  }

  // 3. Student & Faculty Memberships
  const librarianUser = userMap.core.librarian;
  const members = [];

  for (let i = 0; i < Math.min(studentProfiles.length, 50); i++) {
    const student = studentProfiles[i];
    const membershipNumber = `${DEMO_PREFIX}LIB-MEM-${String(i + 1).padStart(3, '0')}`;

    let member = await LibraryMember.findOne({ membershipNumber });
    if (!member) {
      member = await LibraryMember.create({
        user: student.user,
        student: student._id,
        memberType: 'student',
        membershipNumber,
        department: 'Engineering'
      });
    }
    members.push(member);
  }

  // 4. 50 Book Issue Transactions
  let issuesCount = 0;
  for (let i = 0; i < 50; i++) {
    const issueNumber = `${DEMO_PREFIX}ISS-${String(i + 1).padStart(3, '0')}`;
    const book = books[i];
    const copy = copies[i];
    const member = members[i % members.length];
    const student = studentProfiles[i % members.length];

    let issue = await BookIssue.findOne({ issueNumber });
    if (!issue) {
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - (i % 30));
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);

      await BookIssue.create({
        issueNumber,
        book: book._id,
        bookCopy: copy._id,
        member: member._id,
        user: student.user,
        issuedBy: librarianUser._id,
        issueDate,
        dueDate,
        returnDate: i % 3 === 0 ? new Date() : null,
        status: i % 3 === 0 ? 'returned' : 'issued'
      });
      issuesCount++;
    }
  }

  console.log(`[Library] Successfully provisioned ${books.length} books, ${copies.length} physical copies, and ${issuesCount} circulation transactions.`);
}

module.exports = { seedLibrary };

