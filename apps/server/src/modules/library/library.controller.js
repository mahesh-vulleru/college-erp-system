const crypto = require('crypto');
const Book = require('./models/book.model');
const BookCopy = require('./models/bookCopy.model');
const BookCategory = require('./models/category.model');
const LibraryMember = require('./models/member.model');
const BookIssue = require('./models/issue.model');
const BookReservation = require('./models/reservation.model');
const LibraryFine = require('./models/fine.model');
const DigitalResource = require('./models/digitalResource.model');
const LibrarySetting = require('./models/setting.model');
const User = require('../auth/auth.model');
const Student = require('../students/student.model');
const Faculty = require('../faculty/faculty.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');
const { sendFormattedReport } = require('../../utils/exportGenerators');

/**
 * Helper to get or initialize library settings
 */
async function getSettingsDoc() {
  let settings = await LibrarySetting.findOne();
  if (!settings) {
    settings = await LibrarySetting.create({
      libraryName: 'Central Institutional Library',
      studentMaxBooks: 3,
      facultyMaxBooks: 6,
      studentLoanPeriodDays: 14,
      facultyLoanPeriodDays: 30,
      finePerDayOverdue: 5,
      maxRenewalsAllowed: 2
    });
  }
  return settings;
}

// ----------------------------------------------------
// 1. DASHBOARD & ANALYTICS
// ----------------------------------------------------
async function getLibraryDashboard(req, res, next) {
  try {
    const now = new Date();

    const [
      totalBooks,
      availableCopies,
      issuedCopies,
      totalMembers,
      pendingReservations,
      activeIssues,
      pendingFinesDocs,
      recentTransactions,
      categoriesCount,
      digitalCount
    ] = await Promise.all([
      Book.countDocuments({ status: 'active' }),
      BookCopy.countDocuments({ status: 'available' }),
      BookCopy.countDocuments({ status: 'issued' }),
      LibraryMember.countDocuments({ status: 'active' }),
      BookReservation.countDocuments({ status: 'pending' }),
      BookIssue.find({ status: 'issued' }),
      LibraryFine.find({ status: 'pending' }),
      BookIssue.find()
        .populate('book', 'title author isbn')
        .populate('bookCopy', 'accessionNumber')
        .populate('member', 'membershipNumber memberType')
        .populate('user', 'name email')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      BookCategory.countDocuments({ isActive: true }),
      DigitalResource.countDocuments({ status: 'active' })
    ]);

    // Calculate overdue books from active issues
    const overdueIssues = activeIssues.filter((i) => i.dueDate && new Date(i.dueDate) < now);
    const overdueCount = overdueIssues.length;

    // Total pending fines amount
    const pendingFinesAmount = pendingFinesDocs.reduce((sum, f) => sum + (f.amount || 0) - (f.paidAmount || 0) - (f.waivedAmount || 0), 0);

    // Popular Books (top 5 by issue frequency)
    const popularAgg = await BookIssue.aggregate([
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookInfo'
        }
      },
      { $unwind: '$bookInfo' }
    ]);

    const popularBooks = popularAgg.map((item) => ({
      _id: item._id,
      title: item.bookInfo.title,
      author: item.bookInfo.author,
      isbn: item.bookInfo.isbn,
      issueCount: item.count
    }));

    // Monthly Issue/Return trends for past 6 months
    const monthlyStats = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const [issuedCount, returnedCount] = await Promise.all([
        BookIssue.countDocuments({ issueDate: { $gte: start, $lte: end } }),
        BookIssue.countDocuments({ returnDate: { $gte: start, $lte: end } })
      ]);

      const monthName = start.toLocaleString('default', { month: 'short' });
      monthlyStats.push({ month: monthName, issues: issuedCount, returns: returnedCount });
    }

    // Overdue Alerts list with computed days overdue & estimated fine
    const settings = await getSettingsDoc();
    const fineRate = settings.finePerDayOverdue || 5;

    const overdueAlerts = await Promise.all(
      overdueIssues.slice(0, 10).map(async (issue) => {
        const diffMs = now.getTime() - new Date(issue.dueDate).getTime();
        const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const estimatedFine = daysOverdue * fineRate;

        await issue.populate('book', 'title author');
        await issue.populate('bookCopy', 'accessionNumber');
        await issue.populate('user', 'name email');
        await issue.populate('member', 'membershipNumber memberType');

        return {
          issueId: issue._id,
          issueNumber: issue.issueNumber,
          bookTitle: issue.book?.title || 'Unknown Book',
          accessionNumber: issue.bookCopy?.accessionNumber || 'N/A',
          borrowerName: issue.user?.name || 'Member',
          borrowerEmail: issue.user?.email,
          membershipNumber: issue.member?.membershipNumber,
          dueDate: issue.dueDate,
          daysOverdue,
          estimatedFine
        };
      })
    );

    return sendSuccess(res, {
      message: 'Library dashboard summary metrics fetched successfully',
      data: {
        summary: {
          totalTitles: totalBooks,
          totalCopies: availableCopies + issuedCopies,
          availableCopies,
          issuedCopies,
          overdueIssues: overdueCount,
          totalMembers,
          unpaidFinesTotal: pendingFinesAmount,
          pendingReservations
        },
        totalBooks,
        availableCopies,
        issuedCopies,
        totalCopies: availableCopies + issuedCopies,
        overdueBooks: overdueCount,
        totalMembers,
        pendingReservations,
        pendingFinesAmount,
        categoriesCount,
        digitalCount,
        recentTransactions,
        popularBooks,
        monthlyStats,
        overdueAlerts
      }
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 2. BOOK MANAGEMENT
// ----------------------------------------------------
async function listBooks(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { status: 'active' };
    if (req.query.category) query.category = req.query.category;
    if (req.query.department) query.department = req.query.department;

    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ title: regex }, { author: regex }, { publisher: regex }, { isbn: regex }, { callNumber: regex }];
    }

    const [books, total] = await Promise.all([
      Book.find(query)
        .populate('category', 'name code')
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit),
      Book.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Books catalog retrieved',
      data: books,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getBookById(req, res, next) {
  try {
    const book = await Book.findById(req.params.id).populate('category', 'name code shelfLocation');
    if (!book) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Book not found in library repository',
        code: 'NOT_FOUND'
      });
    }

    const copies = await BookCopy.find({ book: book._id })
      .populate({
        path: 'currentIssue',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'member', select: 'membershipNumber' }
        ]
      })
      .sort({ accessionNumber: 1 });

    return sendSuccess(res, {
      data: {
        book,
        copies
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createBook(req, res, next) {
  try {
    const {
      title,
      isbn,
      author,
      publisher,
      edition,
      yearPublished,
      category,
      department,
      numberOfCopies,
      copiesCount: bodyCopiesCount,
      shelfLocation,
      rackNumber,
      callNumber,
      price,
      description
    } = req.body;

    const copiesCount = Math.max(1, parseInt(numberOfCopies || bodyCopiesCount || 1, 10));

    const book = await Book.create({
      title: title.trim(),
      isbn: isbn ? isbn.trim() : undefined,
      author: author.trim(),
      publisher: publisher.trim(),
      edition: edition || '1st Edition',
      yearPublished: yearPublished ? Number(yearPublished) : undefined,
      category,
      department: department ? department.trim() : undefined,
      totalCopies: copiesCount,
      availableCopies: copiesCount,
      issuedCopies: 0,
      reservedCopies: 0,
      rackNumber: rackNumber || shelfLocation || 'Main Stacks',
      shelfLocation: shelfLocation || rackNumber || 'Main Stacks',
      callNumber: callNumber || '',
      price: price ? Number(price) : 0,
      description: description || ''
    });

    // Create unique physical copies with accession numbers
    const copiesToCreate = [];
    const year = new Date().getFullYear();
    const existingCopiesCount = await BookCopy.countDocuments();

    for (let i = 1; i <= copiesCount; i++) {
      const serial = String(existingCopiesCount + i).padStart(5, '0');
      const accessionNumber = `LIB-${year}-${serial}`;
      copiesToCreate.push({
        book: book._id,
        accessionNumber,
        barcode: accessionNumber,
        condition: 'new',
        status: 'available'
      });
    }

    const createdCopies = await BookCopy.insertMany(copiesToCreate);

    await recordAuditLog({
      req,
      action: 'LIBRARY_BOOK_CREATED',
      entityType: 'Book',
      entityId: book._id,
      details: { title: book.title, author: book.author, totalCopies: copiesCount }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `Book '${book.title}' created with ${copiesCount} physical accession copies`,
      data: { book, copies: createdCopies, copiesGenerated: copiesCount }
    });
  } catch (error) {
    next(error);
  }
}

async function updateBook(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Book not found',
        code: 'NOT_FOUND'
      });
    }

    const { title, isbn, author, publisher, edition, yearPublished, category, department, rackNumber, callNumber, price, description } = req.body;

    if (title) book.title = title.trim();
    if (isbn !== undefined) book.isbn = isbn.trim();
    if (author) book.author = author.trim();
    if (publisher) book.publisher = publisher.trim();
    if (edition) book.edition = edition;
    if (yearPublished !== undefined) book.yearPublished = Number(yearPublished);
    if (category) book.category = category;
    if (department !== undefined) book.department = department;
    if (rackNumber) book.rackNumber = rackNumber;
    if (callNumber !== undefined) book.callNumber = callNumber;
    if (price !== undefined) book.price = Number(price);
    if (description !== undefined) book.description = description;

    await book.save();

    await recordAuditLog({
      req,
      action: 'LIBRARY_BOOK_UPDATED',
      entityType: 'Book',
      entityId: book._id,
      details: { title: book.title }
    });

    return sendSuccess(res, {
      message: 'Book details updated successfully',
      data: book
    });
  } catch (error) {
    next(error);
  }
}

async function addBookCopies(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Book not found',
        code: 'NOT_FOUND'
      });
    }

    const count = Math.max(1, parseInt(req.body.count, 10) || 1);
    const year = new Date().getFullYear();
    const existingCopiesCount = await BookCopy.countDocuments();

    const copiesToCreate = [];
    for (let i = 1; i <= count; i++) {
      const serial = String(existingCopiesCount + i).padStart(5, '0');
      const accessionNumber = `LIB-${year}-${serial}`;
      copiesToCreate.push({
        book: book._id,
        accessionNumber,
        barcode: accessionNumber,
        condition: req.body.condition || 'new',
        status: 'available'
      });
    }

    const createdCopies = await BookCopy.insertMany(copiesToCreate);

    book.totalCopies += count;
    book.availableCopies += count;
    await book.save();

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `Added ${count} physical copies for '${book.title}'`,
      data: createdCopies
    });
  } catch (error) {
    next(error);
  }
}

async function archiveBook(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Book not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if any copies are currently issued
    const activeIssue = await BookCopy.findOne({ book: book._id, status: 'issued' });
    if (activeIssue) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Cannot archive book: physical copies are currently checked out in circulation',
        code: 'BOOK_IN_CIRCULATION'
      });
    }

    book.status = 'archived';
    await book.save();

    await recordAuditLog({
      req,
      action: 'LIBRARY_BOOK_ARCHIVED',
      entityType: 'Book',
      entityId: book._id,
      details: { title: book.title }
    });

    return sendSuccess(res, {
      message: `Book '${book.title}' archived successfully`,
      data: book
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 3. CATEGORIES
// ----------------------------------------------------
async function listCategories(req, res, next) {
  try {
    const categories = await BookCategory.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(res, { data: categories });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, code, description, shelfLocation } = req.body;
    const existing = await BookCategory.findOne({
      $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }]
    });

    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Category with this name or code already exists',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const category = await BookCategory.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description || '',
      shelfLocation: shelfLocation || 'Main Stacks'
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Book category created',
      data: category
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 4. MEMBERS MANAGEMENT
// ----------------------------------------------------
async function listMembers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.memberType) query.memberType = req.query.memberType;
    if (req.query.status) query.status = req.query.status;

    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ membershipNumber: regex }, { department: regex }];
    }

    const [members, total] = await Promise.all([
      LibraryMember.find(query)
        .populate('user', 'name email status role phone')
        .populate('student', 'rollNumber currentSemester')
        .populate('faculty', 'employeeId designation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LibraryMember.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Library members retrieved',
      data: members,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

async function registerMember(req, res, next) {
  try {
    const { userId, user: userParam, memberType = 'student', maxBooks, loanPeriod } = req.body;
    const targetUserId = userId || userParam;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Target user account not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const existingMember = await LibraryMember.findOne({ user: targetUser._id });
    if (existingMember) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `User is already registered as library member (${existingMember.membershipNumber})`,
        code: 'MEMBER_EXISTS'
      });
    }

    const settings = await getSettingsDoc();
    const isStudent = memberType === 'student' || targetUser.role === ROLES.STUDENT;
    const isFaculty = memberType === 'faculty' || targetUser.role === ROLES.FACULTY;

    // Resolve student or faculty profile
    let studentDoc = null;
    let facultyDoc = null;
    let departmentName = targetUser.department || 'General';

    if (isStudent) {
      studentDoc = await Student.findOne({ user: targetUser._id });
      if (studentDoc?.department) departmentName = String(studentDoc.department);
    } else if (isFaculty) {
      facultyDoc = await Faculty.findOne({ user: targetUser._id });
      if (facultyDoc?.department) departmentName = String(facultyDoc.department);
    }

    const count = await LibraryMember.countDocuments();
    const prefix = isStudent ? 'STU' : isFaculty ? 'FAC' : 'MEM';
    const membershipNumber = `LM-${prefix}-${String(count + 1).padStart(4, '0')}`;

    const member = await LibraryMember.create({
      user: targetUser._id,
      memberType: isStudent ? 'student' : isFaculty ? 'faculty' : 'staff',
      membershipNumber,
      student: studentDoc ? studentDoc._id : null,
      faculty: facultyDoc ? facultyDoc._id : null,
      department: departmentName,
      maxBooksAllowed: maxBooks || (isStudent ? settings.studentMaxBooks : settings.facultyMaxBooks),
      loanPeriodDays: loanPeriod || (isStudent ? settings.studentLoanPeriodDays : settings.facultyLoanPeriodDays),
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });

    await recordAuditLog({
      req,
      action: 'LIBRARY_MEMBER_ENROLLED',
      entityType: 'LibraryMember',
      entityId: member._id,
      details: { membershipNumber, userName: targetUser.name, role: targetUser.role }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `Library membership created: ${membershipNumber}`,
      data: member
    });
  } catch (error) {
    next(error);
  }
}

async function getMemberDetails(req, res, next) {
  try {
    const member = await LibraryMember.findById(req.params.id)
      .populate('user', 'name email status phone')
      .populate('student', 'rollNumber currentSemester')
      .populate('faculty', 'employeeId designation');

    if (!member) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Library member not found',
        code: 'NOT_FOUND'
      });
    }

    const [activeIssues, issueHistory, reservations, fines] = await Promise.all([
      BookIssue.find({ member: member._id, status: { $in: ['issued', 'overdue'] } })
        .populate('book', 'title author isbn rackNumber')
        .populate('bookCopy', 'accessionNumber condition')
        .sort({ dueDate: 1 }),
      BookIssue.find({ member: member._id, status: 'returned' })
        .populate('book', 'title author')
        .populate('bookCopy', 'accessionNumber')
        .sort({ returnDate: -1 })
        .limit(20),
      BookReservation.find({ member: member._id })
        .populate('book', 'title author')
        .sort({ reservationDate: -1 }),
      LibraryFine.find({ member: member._id })
        .populate('book', 'title')
        .sort({ createdAt: -1 })
    ]);

    return sendSuccess(res, {
      data: {
        member,
        activeIssues,
        issueHistory,
        reservations,
        fines
      }
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 5. CIRCULATION (ISSUE, RETURN, RENEW)
// ----------------------------------------------------
async function issueBook(req, res, next) {
  try {
    const { memberId, membershipNumber, membershipCardNumber, copyId, accessionNumber, customDueDate, dueDate: reqDueDate, remarks } = req.body;
    const effectiveMemberNum = membershipNumber || membershipCardNumber;

    // 1. Resolve Member
    let member = null;
    if (memberId) member = await LibraryMember.findById(memberId).populate('user');
    else if (effectiveMemberNum) member = await LibraryMember.findOne({
      $or: [
        { membershipNumber: effectiveMemberNum.toUpperCase().trim() },
        { membershipCardNumber: effectiveMemberNum.toUpperCase().trim() }
      ]
    }).populate('user');

    if (!member) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Library member record not found',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    if (member.status !== 'active') {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: `Member status is '${member.status}'. Book checkout blocked.`,
        code: 'MEMBER_NOT_ACTIVE'
      });
    }

    const activeCount = member.currentBooksIssued ?? member.activeIssuesCount ?? 0;
    if (activeCount >= member.maxBooksAllowed) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Member has reached maximum borrowing limit (${member.maxBooksAllowed} books). Please return a book first.`,
        code: 'BORROWING_LIMIT_REACHED'
      });
    }

    // 2. Resolve Physical Copy
    let copy = null;
    if (copyId) copy = await BookCopy.findById(copyId).populate('book');
    else if (accessionNumber) copy = await BookCopy.findOne({ accessionNumber: accessionNumber.toUpperCase().trim() }).populate('book');

    if (!copy) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Physical copy not found with given identifier',
        code: 'COPY_NOT_FOUND'
      });
    }

    if (copy.status !== 'available') {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `Book copy '${copy.accessionNumber}' is not available (Current status: ${copy.status}).`,
        code: 'COPY_NOT_AVAILABLE'
      });
    }

    // 3. Prevent duplicate active issue of the exact same book title to the same member
    const existingIssueSameBook = await BookIssue.findOne({
      member: member._id,
      book: copy.book._id,
      status: { $in: ['issued', 'overdue'] }
    });
    if (existingIssueSameBook) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Member already has an active checked-out copy of this book title.',
        code: 'DUPLICATE_ISSUE'
      });
    }

    // 4. Calculate Due Date
    const loanDays = member.loanPeriodDays || 14;
    const effectiveDueDate = reqDueDate || customDueDate;
    const dueDate = effectiveDueDate ? new Date(effectiveDueDate) : new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000);

    const issueCount = await BookIssue.countDocuments();
    const year = new Date().getFullYear();
    const issueNumber = `ISSUE-${year}-${String(issueCount + 1).padStart(5, '0')}`;

    // 5. Create Issue Transaction
    const issue = await BookIssue.create({
      issueNumber,
      book: copy.book._id,
      bookCopy: copy._id,
      member: member._id,
      user: member.user._id,
      issueDate: new Date(),
      dueDate,
      status: 'issued',
      issuedBy: req.user._id,
      remarks: remarks || ''
    });

    // 6. Update Physical Copy status
    copy.status = 'issued';
    copy.currentIssue = issue._id;
    await copy.save();

    // 7. Update Member count
    member.currentBooksIssued += 1;
    await member.save();

    // 8. Update Book count
    await Book.findByIdAndUpdate(copy.book._id, {
      $inc: { issuedCopies: 1, availableCopies: -1 }
    });

    await recordAuditLog({
      req,
      action: 'LIBRARY_BOOK_ISSUED',
      entityType: 'BookIssue',
      entityId: issue._id,
      details: {
        issueNumber,
        bookTitle: copy.book.title,
        accessionNumber: copy.accessionNumber,
        member: member.membershipNumber,
        dueDate
      }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `Book '${copy.book.title}' (Copy ${copy.accessionNumber}) successfully issued to ${member.membershipNumber}`,
      data: issue
    });
  } catch (error) {
    next(error);
  }
}

async function returnBook(req, res, next) {
  try {
    const { issueId, accessionNumber, condition = 'good', remarks } = req.body;

    let issue = null;
    if (issueId) {
      issue = await BookIssue.findById(issueId).populate('book bookCopy member');
    } else if (accessionNumber) {
      const copy = await BookCopy.findOne({ accessionNumber: accessionNumber.toUpperCase().trim() });
      if (copy) {
        if (copy.currentIssue) {
          issue = await BookIssue.findById(copy.currentIssue).populate('book bookCopy member');
        }
        if (!issue) {
          issue = await BookIssue.findOne({ bookCopy: copy._id, status: { $in: ['issued', 'overdue'] } }).populate('book bookCopy member');
        }
      }
    }

    if (!issue) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Active circulation checkout record not found',
        code: 'ISSUE_NOT_FOUND'
      });
    }

    if (issue.status === 'returned') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'This book has already been recorded as returned.',
        code: 'ALREADY_RETURNED'
      });
    }

    const returnDate = new Date();
    const settings = await getSettingsDoc();
    const fineRate = settings.finePerDayOverdue || 5;

    let overdueFineAmount = 0;
    let daysOverdue = 0;

    // Check if overdue
    if (new Date(issue.dueDate) < returnDate) {
      const diffMs = returnDate.getTime() - new Date(issue.dueDate).getTime();
      daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      overdueFineAmount = daysOverdue * fineRate;
    }

    // Update Issue record
    issue.returnDate = returnDate;
    issue.status = 'returned';
    issue.returnedTo = req.user._id;
    issue.fineAmount = overdueFineAmount;
    if (remarks) issue.remarks = remarks;
    await issue.save();

    // If fine accrued, create fine record
    let fineDoc = null;
    if (overdueFineAmount > 0) {
      const fineCount = await LibraryFine.countDocuments();
      const fineNumber = `FINE-${new Date().getFullYear()}-${String(fineCount + 1).padStart(5, '0')}`;

      fineDoc = await LibraryFine.create({
        fineNumber,
        member: issue.member._id,
        user: issue.user,
        bookIssue: issue._id,
        book: issue.book._id,
        fineReason: 'overdue',
        overdueDays: daysOverdue,
        amount: overdueFineAmount,
        status: 'pending'
      });

      // Increment member fines
      await LibraryMember.findByIdAndUpdate(issue.member._id, {
        $inc: { totalFinesDue: overdueFineAmount }
      });
    }

    // Update Physical Copy condition and status
    const copyStatus = condition === 'damaged' ? 'damaged' : condition === 'lost' ? 'lost' : 'available';
    await BookCopy.findByIdAndUpdate(issue.bookCopy._id, {
      status: copyStatus,
      condition,
      currentIssue: null
    });

    // Update Member current issue count
    await LibraryMember.findByIdAndUpdate(issue.member._id, {
      $inc: { currentBooksIssued: -1 }
    });

    // Update Book count
    const incAvailable = copyStatus === 'available' ? 1 : 0;
    await Book.findByIdAndUpdate(issue.book._id, {
      $inc: { issuedCopies: -1, availableCopies: incAvailable }
    });

    await recordAuditLog({
      req,
      action: 'LIBRARY_BOOK_RETURNED',
      entityType: 'BookIssue',
      entityId: issue._id,
      details: {
        issueNumber: issue.issueNumber,
        bookTitle: issue.book.title,
        daysOverdue,
        fineAmount: overdueFineAmount
      }
    });

    return sendSuccess(res, {
      message: `Book returned successfully.${overdueFineAmount > 0 ? ` Overdue fine of ₹${overdueFineAmount} generated (${daysOverdue} days overdue).` : ''}`,
      data: {
        issue,
        fine: fineDoc
      }
    });
  } catch (error) {
    next(error);
  }
}

async function renewBook(req, res, next) {
  try {
    const { issueId } = req.body;
    const issue = await BookIssue.findById(issueId).populate('book member');

    if (!issue) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Active checkout record not found',
        code: 'NOT_FOUND'
      });
    }

    if (issue.status !== 'issued' && issue.status !== 'overdue') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Cannot renew book in '${issue.status}' status.`,
        code: 'INVALID_STATUS'
      });
    }

    if (issue.renewalCount >= issue.maxRenewals) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Maximum renewal limit (${issue.maxRenewals}) reached for this checkout. Book must be returned.`,
        code: 'MAX_RENEWALS_REACHED'
      });
    }

    // Check if book has pending reservations
    const pendingReservation = await BookReservation.findOne({
      book: issue.book._id,
      status: 'pending'
    });
    if (pendingReservation) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Book cannot be renewed: a pending reservation exists for another patron.',
        code: 'BOOK_RESERVED'
      });
    }

    const loanDays = issue.member.loanPeriodDays || 14;
    const newDueDate = new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000);

    issue.dueDate = newDueDate;
    issue.renewalCount += 1;
    issue.status = 'issued';
    await issue.save();

    await recordAuditLog({
      req,
      action: 'LIBRARY_BOOK_RENEWED',
      entityType: 'BookIssue',
      entityId: issue._id,
      details: {
        issueNumber: issue.issueNumber,
        renewalCount: issue.renewalCount,
        newDueDate
      }
    });

    return sendSuccess(res, {
      message: `Book renewal successful. New due date is ${newDueDate.toLocaleDateString()}. (Renewal ${issue.renewalCount} of ${issue.maxRenewals})`,
      data: {
        ...(issue.toObject ? issue.toObject() : issue),
        renewalCount: issue.renewalCount,
        renewCount: issue.renewalCount
      }
    });
  } catch (error) {
    next(error);
  }
}

async function listIssues(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.member) query.member = req.query.member;
    if (req.query.book) query.book = req.query.book;

    // Filter overdue explicitly
    if (req.query.filter === 'overdue') {
      query.status = { $in: ['issued', 'overdue'] };
      query.dueDate = { $lt: new Date() };
    }

    const [issues, total] = await Promise.all([
      BookIssue.find(query)
        .populate('book', 'title author isbn rackNumber')
        .populate('bookCopy', 'accessionNumber condition')
        .populate('member', 'membershipNumber memberType department')
        .populate('user', 'name email role phone')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookIssue.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Circulation issues retrieved',
      data: issues,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 6. RESERVATIONS
// ----------------------------------------------------
async function listReservations(req, res, next) {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;

    const reservations = await BookReservation.find(query)
      .populate('book', 'title author isbn availableCopies')
      .populate('member', 'membershipNumber memberType')
      .populate('user', 'name email')
      .sort({ reservationDate: -1 });

    return sendSuccess(res, { data: reservations });
  } catch (error) {
    next(error);
  }
}

async function createReservation(req, res, next) {
  try {
    const { bookId, memberId, notes } = req.body;

    const [book, member] = await Promise.all([
      Book.findById(bookId),
      LibraryMember.findById(memberId).populate('user')
    ]);

    if (!book || !member) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Book or Member not found',
        code: 'NOT_FOUND'
      });
    }

    // Check duplicate pending reservation
    const existing = await BookReservation.findOne({
      book: book._id,
      member: member._id,
      status: 'pending'
    });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Member already has an active pending reservation for this book',
        code: 'DUPLICATE_RESERVATION'
      });
    }

    const count = await BookReservation.countDocuments();
    const reservationNumber = `RES-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const reservation = await BookReservation.create({
      reservationNumber,
      book: book._id,
      member: member._id,
      user: member.user._id,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      notes: notes || ''
    });

    book.reservedCopies = (book.reservedCopies || 0) + 1;
    await book.save();

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `Reservation confirmed: ${reservationNumber}`,
      data: reservation
    });
  } catch (error) {
    next(error);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const reservation = await BookReservation.findById(req.params.id);
    if (!reservation) {
      return sendError(res, { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Reservation not found' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    await Book.findByIdAndUpdate(reservation.book, {
      $inc: { reservedCopies: -1 }
    });

    return sendSuccess(res, { message: 'Reservation cancelled', data: reservation });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 7. FINES & WAIVERS
// ----------------------------------------------------
async function listFines(req, res, next) {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;

    const fines = await LibraryFine.find(query)
      .populate('member', 'membershipNumber memberType department')
      .populate('user', 'name email')
      .populate('book', 'title author')
      .populate('bookIssue', 'issueNumber dueDate returnDate')
      .populate('waivedBy', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { data: fines });
  } catch (error) {
    next(error);
  }
}

async function payFine(req, res, next) {
  try {
    const { fineId, amount, paymentReference } = req.body;
    const fine = await LibraryFine.findById(fineId);
    if (!fine) {
      return sendError(res, { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Fine record not found' });
    }

    const payAmt = Number(amount) || fine.amount;
    fine.paidAmount = (fine.paidAmount || 0) + payAmt;
    fine.paymentReference = paymentReference || `CASH-${Date.now()}`;
    fine.paymentDate = new Date();

    if (fine.paidAmount >= fine.amount) {
      fine.status = 'paid';
    } else {
      fine.status = 'partially_paid';
    }
    await fine.save();

    if (fine.member) {
      await LibraryMember.findByIdAndUpdate(fine.member, {
        $inc: { totalFinesDue: -payAmt }
      });
    }

    return sendSuccess(res, { message: 'Fine payment recorded', data: fine });
  } catch (error) {
    next(error);
  }
}

async function waiveFine(req, res, next) {
  try {
    const { fineId, waiveReason, reason } = req.body;
    const effectiveReason = (waiveReason || reason || '').trim();
    if (!effectiveReason) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'A documented reason is mandatory when authorizing a fine waiver',
        code: 'REASON_REQUIRED'
      });
    }

    const fine = await LibraryFine.findById(fineId);
    if (!fine) {
      return sendError(res, { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Fine record not found' });
    }

    if (fine.status === 'paid' || fine.status === 'waived') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Fine is already marked as ${fine.status}`
      });
    }

    const remainingAmount = fine.amount - (fine.paidAmount || 0);
    fine.waivedAmount = remainingAmount;
    fine.status = 'waived';
    fine.waivedBy = req.user._id;
    fine.waiveReason = effectiveReason;
    fine.waiverReason = effectiveReason;
    await fine.save();

    // Decrement member fine balance
    await LibraryMember.findByIdAndUpdate(fine.member, {
      $inc: { totalFinesDue: -remainingAmount }
    });

    await recordAuditLog({
      req,
      action: 'LIBRARY_FINE_WAIVED',
      entityType: 'LibraryFine',
      entityId: fine._id,
      details: {
        fineNumber: fine.fineNumber,
        waivedAmount: remainingAmount,
        reason: effectiveReason
      }
    });

    return sendSuccess(res, { message: 'Fine waiver authorized successfully', data: fine });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 8. DIGITAL RESOURCES
// ----------------------------------------------------
async function listDigitalResources(req, res, next) {
  try {
    const query = { status: 'active' };
    if (req.query.type) query.resourceType = req.query.type;
    if (req.query.q) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ title: regex }, { author: regex }, { publisher: regex }];
    }

    const resources = await DigitalResource.find(query).populate('category', 'name').sort({ createdAt: -1 });
    return sendSuccess(res, { data: resources });
  } catch (error) {
    next(error);
  }
}

async function createDigitalResource(req, res, next) {
  try {
    const { title, resourceType, author, publisher, category, department, fileUrl, fileSizeMb, accessLevel } = req.body;

    const resource = await DigitalResource.create({
      title: title.trim(),
      resourceType: resourceType || 'ebook',
      author: author.trim(),
      publisher: publisher ? publisher.trim() : '',
      category: category || null,
      department: department || '',
      fileUrl: fileUrl.trim(),
      fileSizeMb: Number(fileSizeMb) || 5,
      accessLevel: accessLevel || 'members_only'
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Digital library resource cataloged successfully',
      data: resource
    });
  } catch (error) {
    next(error);
  }
}

async function recordDownload(req, res, next) {
  try {
    const resource = await DigitalResource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    return sendSuccess(res, { data: resource });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 9. SETTINGS & CONFIGURATION
// ----------------------------------------------------
async function getLibrarySettings(req, res, next) {
  try {
    const settings = await getSettingsDoc();
    const result = {
      ...(settings.toObject ? settings.toObject() : settings),
      finePerDay: settings.finePerDayOverdue || settings.finePerDay || 5,
      defaultLoanPeriodDays: settings.studentLoanPeriodDays || settings.defaultLoanPeriodDays || 14,
      facultyLoanPeriodDays: settings.facultyLoanPeriodDays || 30,
      maxBooksAllowedStudent: settings.studentMaxBooks || settings.maxBooksAllowedStudent || 3,
      maxBooksAllowedFaculty: settings.facultyMaxBooks || settings.maxBooksAllowedFaculty || 6,
      maxRenewalsAllowed: settings.maxRenewalsAllowed || 2
    };
    return sendSuccess(res, { data: result });
  } catch (error) {
    next(error);
  }
}

async function updateLibrarySettings(req, res, next) {
  try {
    const settings = await getSettingsDoc();
    const {
      libraryName,
      workingHours,
      studentMaxBooks,
      facultyMaxBooks,
      maxBooksAllowedStudent,
      maxBooksAllowedFaculty,
      studentLoanPeriodDays,
      facultyLoanPeriodDays,
      defaultLoanPeriodDays,
      finePerDayOverdue,
      finePerDay,
      maxRenewalsAllowed,
      reservationHoldHours
    } = req.body;

    const effectiveFine = finePerDayOverdue ?? finePerDay;
    if (effectiveFine !== undefined) {
      settings.finePerDayOverdue = Number(effectiveFine);
      settings.finePerDay = Number(effectiveFine);
    }

    const effectiveStuLoan = studentLoanPeriodDays ?? defaultLoanPeriodDays;
    if (effectiveStuLoan !== undefined) {
      settings.studentLoanPeriodDays = Number(effectiveStuLoan);
      settings.defaultLoanPeriodDays = Number(effectiveStuLoan);
    }

    if (facultyLoanPeriodDays !== undefined) settings.facultyLoanPeriodDays = Number(facultyLoanPeriodDays);

    const effectiveStuMax = studentMaxBooks ?? maxBooksAllowedStudent;
    if (effectiveStuMax !== undefined) {
      settings.studentMaxBooks = Number(effectiveStuMax);
      settings.maxBooksAllowedStudent = Number(effectiveStuMax);
    }

    const effectiveFacMax = facultyMaxBooks ?? maxBooksAllowedFaculty;
    if (effectiveFacMax !== undefined) {
      settings.facultyMaxBooks = Number(effectiveFacMax);
      settings.maxBooksAllowedFaculty = Number(effectiveFacMax);
    }

    if (libraryName) settings.libraryName = libraryName.trim();
    if (workingHours) settings.workingHours = workingHours.trim();
    if (studentMaxBooks !== undefined) settings.studentMaxBooks = Number(studentMaxBooks);
    if (facultyMaxBooks !== undefined) settings.facultyMaxBooks = Number(facultyMaxBooks);
    if (studentLoanPeriodDays !== undefined) settings.studentLoanPeriodDays = Number(studentLoanPeriodDays);
    if (facultyLoanPeriodDays !== undefined) settings.facultyLoanPeriodDays = Number(facultyLoanPeriodDays);
    if (finePerDayOverdue !== undefined) settings.finePerDayOverdue = Number(finePerDayOverdue);
    if (maxRenewalsAllowed !== undefined) settings.maxRenewalsAllowed = Number(maxRenewalsAllowed);
    if (reservationHoldHours !== undefined) settings.reservationHoldHours = Number(reservationHoldHours);

    await settings.save();

    await recordAuditLog({
      req,
      action: 'LIBRARY_SETTINGS_UPDATED',
      entityType: 'LibrarySetting',
      entityId: settings._id,
      details: { finePerDayOverdue: settings.finePerDayOverdue }
    });

    const result = {
      ...(settings.toObject ? settings.toObject() : settings),
      finePerDay: settings.finePerDayOverdue || settings.finePerDay,
      defaultLoanPeriodDays: settings.studentLoanPeriodDays || settings.defaultLoanPeriodDays,
      facultyLoanPeriodDays: settings.facultyLoanPeriodDays,
      maxBooksAllowedStudent: settings.studentMaxBooks || settings.maxBooksAllowedStudent,
      maxBooksAllowedFaculty: settings.facultyMaxBooks || settings.maxBooksAllowedFaculty,
      maxRenewalsAllowed: settings.maxRenewalsAllowed
    };
    return sendSuccess(res, { message: 'Library policy settings updated', data: result });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 10. REPORTS & EXPORTS
// ----------------------------------------------------
async function exportLibraryReportCsv(req, res, next) {
  try {
    const reportType = (req.query.type || 'inventory').toLowerCase();
    const format = req.query.format || 'csv';

    if (reportType === 'issues' || reportType === 'circulation') {
      const issues = await BookIssue.find()
        .populate('book', 'title author isbn')
        .populate('bookCopy', 'accessionNumber')
        .populate('member', 'membershipNumber memberType')
        .populate('user', 'name email')
        .sort({ issueDate: -1 });

      const headers = ['Issue Number', 'Book Title', 'Accession Number', 'Member Card', 'Borrower Name', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine (INR)'];
      const rows = issues.map((i) => [
        i.issueNumber,
        `"${i.book?.title || ''}"`,
        i.bookCopy?.accessionNumber || '',
        i.member?.membershipNumber || '',
        `"${i.user?.name || ''}"`,
        i.issueDate ? new Date(i.issueDate).toISOString().split('T')[0] : '',
        i.dueDate ? new Date(i.dueDate).toISOString().split('T')[0] : '',
        i.returnDate ? new Date(i.returnDate).toISOString().split('T')[0] : '',
        i.status,
        i.fineAmount || 0
      ]);

      return sendFormattedReport(res, {
        title: 'Library Circulation & Issues Report',
        filenameBase: 'library-circulation-report',
        headers,
        rows,
        format
      });
    }

    if (reportType === 'fines') {
      const fines = await LibraryFine.find()
        .populate('member', 'membershipNumber')
        .populate('user', 'name email')
        .populate('book', 'title')
        .sort({ createdAt: -1 });

      const headers = ['Fine Number', 'Member', 'Patron Name', 'Book', 'Reason', 'Overdue Days', 'Amount (INR)', 'Paid (INR)', 'Status'];
      const rows = fines.map((f) => [
        f.fineNumber,
        f.member?.membershipNumber || '',
        `"${f.user?.name || ''}"`,
        `"${f.book?.title || ''}"`,
        f.fineReason,
        f.overdueDays || 0,
        f.amount,
        f.paidAmount || 0,
        f.status
      ]);

      return sendFormattedReport(res, {
        title: 'Library Fines & Collection Report',
        filenameBase: 'library-fines-report',
        headers,
        rows,
        format
      });
    }

    // Default: Inventory
    const books = await Book.find({ status: 'active' }).populate('category', 'name code').sort({ title: 1 });
    const headers = ['Title', 'Author', 'Publisher', 'ISBN', 'Category', 'Total Copies', 'Available', 'Issued', 'Rack Location'];
    const rows = books.map((b) => [
      `"${b.title}"`,
      `"${b.author}"`,
      `"${b.publisher}"`,
      b.isbn || '',
      b.category?.name || '',
      b.totalCopies,
      b.availableCopies,
      b.issuedCopies,
      b.rackNumber || ''
    ]);

    return sendFormattedReport(res, {
      title: 'Library Book Inventory Registry',
      filenameBase: 'library-inventory-report',
      headers,
      rows,
      format
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 11. LIBRARY STAFF SPECIFIC ANALYTICS & ACTIVITY
// ----------------------------------------------------
async function getStaffDashboard(req, res, next) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      booksIssuedToday,
      booksReturnedToday,
      activeIssues,
      pendingReservations,
      recentTransactions,
      myIssuesToday,
      myReturnsToday,
      myTotalTransactions
    ] = await Promise.all([
      BookIssue.countDocuments({ issueDate: { $gte: startOfToday } }),
      BookIssue.countDocuments({ returnDate: { $gte: startOfToday } }),
      BookIssue.find({ status: { $in: ['issued', 'overdue'] } })
        .populate('book', 'title author isbn rackNumber shelfLocation')
        .populate('bookCopy', 'accessionNumber condition')
        .populate('member', 'membershipNumber memberType department')
        .populate('user', 'name email role')
        .sort({ dueDate: 1 }),
      BookReservation.countDocuments({ status: 'pending' }),
      BookIssue.find()
        .populate('book', 'title author isbn')
        .populate('bookCopy', 'accessionNumber')
        .populate('member', 'membershipNumber memberType')
        .populate('user', 'name email')
        .populate('issuedBy', 'name email')
        .populate('returnedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      BookIssue.countDocuments({ issuedBy: req.user._id, issueDate: { $gte: startOfToday } }),
      BookIssue.countDocuments({ returnedTo: req.user._id, returnDate: { $gte: startOfToday } }),
      BookIssue.countDocuments({
        $or: [{ issuedBy: req.user._id }, { returnedTo: req.user._id }]
      })
    ]);

    const overdueIssues = activeIssues.filter((i) => i.dueDate && new Date(i.dueDate) < now);
    const activeTransactions = activeIssues.length;
    const overdueBooks = overdueIssues.length;
    const pendingReturns = activeIssues.length;

    return sendSuccess(res, {
      data: {
        summary: {
          booksIssuedToday,
          booksReturnedToday,
          activeTransactions,
          pendingReturns,
          overdueBooks,
          pendingReservations
        },
        myActivity: {
          issuesToday: myIssuesToday,
          returnsToday: myReturnsToday,
          totalTransactions: myTotalTransactions
        },
        recentTransactions,
        overdueList: overdueIssues.slice(0, 10),
        activeIssuesList: activeIssues.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyTransactions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ issuedBy: req.user._id }, { returnedTo: req.user._id }]
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [transactions, total] = await Promise.all([
      BookIssue.find(query)
        .populate('book', 'title author isbn rackNumber shelfLocation')
        .populate('bookCopy', 'accessionNumber condition status')
        .populate('member', 'membershipNumber memberType department')
        .populate('user', 'name email role phone')
        .populate('issuedBy', 'name email')
        .populate('returnedTo', 'name email')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookIssue.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Staff transactions retrieved',
      data: transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// 12. LIBRARIAN-MANAGED LIBRARY STAFF ACCOUNTS & ASSIGNMENT
// ----------------------------------------------------
async function listLibraryStaff(req, res, next) {
  try {
    const staff = await User.find({ role: ROLES.LIBRARY_STAFF })
      .select('-password')
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: 'Library staff members retrieved',
      data: staff
    });
  } catch (error) {
    next(error);
  }
}

async function createOrAssignLibraryStaff(req, res, next) {
  try {
    const { name, email, password, department, employeeId, assignExisting, userId } = req.body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Institutional email address is required'
      });
    }

    // Assign existing user to library_staff role
    if (assignExisting || userId) {
      const existingUser = userId
        ? await User.findById(userId)
        : await User.findOne({ email: cleanEmail });

      if (!existingUser) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Existing user not found with given identifier/email'
        });
      }

      // Prevent altering Super Admin, Principal, or Chief Librarian accounts
      if ([ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN].includes(existingUser.role)) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: `Cannot reassign user with role '${existingUser.role}' to library staff`
        });
      }

      existingUser.role = ROLES.LIBRARY_STAFF;
      if (department) existingUser.department = department;
      if (employeeId) existingUser.employeeId = employeeId;
      await existingUser.save();

      await recordAuditLog({
        req,
        action: 'LIBRARY_STAFF_ROLE_ASSIGNED',
        entityType: 'User',
        entityId: existingUser._id,
        details: { email: existingUser.email, role: ROLES.LIBRARY_STAFF }
      });

      return sendSuccess(res, {
        message: `User ${existingUser.name} (${existingUser.email}) successfully assigned to Library Staff role`,
        data: existingUser.toSafeObject ? existingUser.toSafeObject() : existingUser
      });
    }

    // Create new Library Staff user
    if (!name || !name.trim()) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Staff member name is required'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(cleanEmail)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Please provide a valid institutional email address'
      });
    }

    // Prevent duplicate employee accounts
    const duplicate = await User.findOne({ email: cleanEmail });
    if (duplicate) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `An account already exists with email '${cleanEmail}'. Use 'Assign Existing' to update role.`
      });
    }

    const securePassword = password || 'Password123!';

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: securePassword,
      role: ROLES.LIBRARY_STAFF,
      department: department?.trim() || 'Central Library',
      status: 'active',
      isTemporaryPassword: !password
    });

    await recordAuditLog({
      req,
      action: 'LIBRARY_STAFF_ACCOUNT_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      details: { name: newUser.name, email: newUser.email, role: ROLES.LIBRARY_STAFF }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `Library Staff account created successfully for ${newUser.name}`,
      data: newUser.toSafeObject ? newUser.toSafeObject() : newUser
    });
  } catch (error) {
    next(error);
  }
}

async function updateLibraryStaffStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: "Status must be 'active', 'inactive', or 'suspended'"
      });
    }

    const staff = await User.findById(id);
    if (!staff) {
      return sendError(res, { statusCode: HTTP_STATUS.NOT_FOUND, message: 'User not found' });
    }

    if (staff.role !== ROLES.LIBRARY_STAFF) {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: 'Can only update status of Library Staff accounts'
      });
    }

    staff.status = status;
    await staff.save();

    await recordAuditLog({
      req,
      action: 'LIBRARY_STAFF_STATUS_UPDATED',
      entityType: 'User',
      entityId: staff._id,
      details: { status }
    });

    return sendSuccess(res, {
      message: `Library staff account status updated to '${status}'`,
      data: staff.toSafeObject ? staff.toSafeObject() : staff
    });
  } catch (error) {
    next(error);
  }
}

async function resetLibraryStaffPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'New password must be at least 6 characters long'
      });
    }

    const staff = await User.findById(id);
    if (!staff) {
      return sendError(res, { statusCode: HTTP_STATUS.NOT_FOUND, message: 'User not found' });
    }

    if (staff.role !== ROLES.LIBRARY_STAFF) {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: 'Can only reset password for Library Staff accounts'
      });
    }

    staff.password = newPassword;
    staff.isTemporaryPassword = true;
    await staff.save();

    await recordAuditLog({
      req,
      action: 'LIBRARY_STAFF_PASSWORD_RESET',
      entityType: 'User',
      entityId: staff._id,
      details: { email: staff.email }
    });

    return sendSuccess(res, { message: 'Library staff password reset successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLibraryDashboard,
  getStaffDashboard,
  getMyTransactions,
  listLibraryStaff,
  createOrAssignLibraryStaff,
  updateLibraryStaffStatus,
  resetLibraryStaffPassword,
  listBooks,
  getBookById,
  createBook,
  updateBook,
  addBookCopies,
  archiveBook,
  listCategories,
  createCategory,
  listMembers,
  registerMember,
  getMemberDetails,
  issueBook,
  returnBook,
  renewBook,
  listIssues,
  listReservations,
  createReservation,
  cancelReservation,
  listFines,
  payFine,
  waiveFine,
  listDigitalResources,
  createDigitalResource,
  recordDownload,
  getLibrarySettings,
  updateLibrarySettings,
  exportLibraryReportCsv
};
