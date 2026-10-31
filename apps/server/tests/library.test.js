const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const {
  BookCategory,
  Book,
  BookCopy,
  LibraryMember,
  BookIssue,
  BookReservation,
  LibraryFine,
  DigitalResource,
  LibrarySetting
} = require('../src/modules/library/models');

describe('Library Subsystem Test Suite', () => {
  const librarianUser = {
    _id: '507f1f77bcf86cd799439101',
    name: 'Mrs. Evelyn Reed',
    email: 'librarian@college.edu',
    role: ROLES.LIBRARIAN,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439102',
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const librarianToken = jwt.sign(
    { id: librarianUser._id, role: librarianUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: studentUser._id, role: studentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const mockCategory = {
    _id: '507f1f77bcf86cd799439110',
    name: 'Computer Science & Engineering',
    code: 'CSE-01',
    description: 'Core CS'
  };

  const mockBook = {
    _id: '507f1f77bcf86cd799439120',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    category: mockCategory._id,
    totalCopies: 3,
    availableCopies: 3,
    issuedCopies: 0,
    borrowCount: 0,
    status: 'active',
    shelfLocation: 'Rack B-01'
  };

  const mockCopy = {
    _id: '507f1f77bcf86cd799439130',
    book: mockBook._id,
    accessionNumber: 'LIB-2025-00001',
    copyNumber: 1,
    status: 'available',
    condition: 'good',
    save: jest.fn().mockResolvedValue(true)
  };

  const mockMember = {
    _id: '507f1f77bcf86cd799439140',
    user: studentUser,
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    role: 'student',
    memberType: 'student',
    membershipNumber: 'LIB-STU-0001',
    membershipCardNumber: 'LIB-STU-0001',
    rollNumber: 'CS2023001',
    department: 'CSE',
    maxBooksAllowed: 3,
    currentBooksIssued: 0,
    activeIssuesCount: 0,
    status: 'active',
    save: jest.fn().mockResolvedValue(true)
  };

  const mockIssue = {
    _id: '507f1f77bcf86cd799439150',
    issueNumber: 'ISS-2025-00001',
    book: mockBook,
    bookCopy: mockCopy,
    member: mockMember,
    issueDate: new Date('2026-10-01'),
    dueDate: new Date('2026-10-15'),
    status: 'issued',
    renewalCount: 0,
    renewCount: 0,
    maxRenewals: 2,
    save: jest.fn().mockResolvedValue(true),
    toObject: () => ({ ...mockIssue })
  };

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === librarianUser._id) return { select: jest.fn().mockResolvedValue(librarianUser) };
      if (idStr === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Library Dashboard & Overview API', () => {
    it('returns dashboard KPI summaries for Librarian', async () => {
      jest.spyOn(Book, 'countDocuments').mockResolvedValue(25);
      jest.spyOn(BookCopy, 'countDocuments').mockImplementation((filter) => {
        if (filter?.status === 'available') return Promise.resolve(60);
        if (filter?.status === 'issued') return Promise.resolve(15);
        return Promise.resolve(75);
      });
      jest.spyOn(LibraryMember, 'countDocuments').mockResolvedValue(120);
      jest.spyOn(BookReservation, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(BookCategory, 'countDocuments').mockResolvedValue(6);
      jest.spyOn(DigitalResource, 'countDocuments').mockResolvedValue(12);

      jest.spyOn(BookIssue, 'find').mockImplementation((filter) => {
        if (filter?.status === 'issued') {
          return Promise.resolve([]);
        }
        return {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
      });

      jest.spyOn(LibraryFine, 'find').mockResolvedValue([
        { amount: 350, paidAmount: 0, waivedAmount: 0 }
      ]);
      jest.spyOn(BookIssue, 'aggregate').mockResolvedValue([]);
      jest.spyOn(BookIssue, 'countDocuments').mockResolvedValue(10);
      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue({
        finePerDayOverdue: 5,
        studentLoanPeriodDays: 14
      });

      const res = await request(app)
        .get('/api/v1/library/dashboard')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalTitles).toBe(25);
      expect(res.body.data.summary.totalCopies).toBe(75);
      expect(res.body.data.summary.availableCopies).toBe(60);
      expect(res.body.data.summary.issuedCopies).toBe(15);
      expect(res.body.data.summary.totalMembers).toBe(120);
      expect(res.body.data.summary.unpaidFinesTotal).toBe(350);
    });

    it('rejects Student role from accessing Library Dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/library/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Book Catalog Management', () => {
    it('creates a new book title and generates accession physical copies', async () => {
      jest.spyOn(Book, 'create').mockResolvedValue({
        ...mockBook,
        save: jest.fn().mockResolvedValue(true)
      });
      jest.spyOn(BookCopy, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(BookCopy, 'insertMany').mockResolvedValue([mockCopy, mockCopy, mockCopy]);

      const res = await request(app)
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Design Patterns',
          author: 'Erich Gamma et al.',
          isbn: '978-0201633610',
          publisher: 'Addison-Wesley',
          publicationYear: 1994,
          category: mockCategory._id,
          copiesCount: 3,
          shelfLocation: 'Stack CS-02'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.book).toBeDefined();
      expect(res.body.data.copiesGenerated).toBe(3);
    });

    it('prevents non-librarian (Student) from adding books', async () => {
      const res = await request(app)
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Book',
          author: 'Hacker'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('3. Book Circulation Engine (Issue, Return, Renewal)', () => {
    it('issues an available book copy to an eligible library member', async () => {
      jest.spyOn(LibraryMember, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMember)
      });
      jest.spyOn(BookCopy, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockCopy,
          book: mockBook
        })
      });
      jest.spyOn(BookIssue, 'findOne').mockResolvedValue(null);
      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue({
        studentLoanPeriodDays: 14,
        maxBooksAllowedStudent: 3
      });
      jest.spyOn(BookIssue, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(BookIssue, 'create').mockResolvedValue(mockIssue);
      jest.spyOn(Book, 'findByIdAndUpdate').mockResolvedValue(true);
      jest.spyOn(BookCopy, 'findByIdAndUpdate').mockResolvedValue(true);
      jest.spyOn(BookCopy, 'findOneAndUpdate').mockResolvedValue(true);
      jest.spyOn(BookCopy, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          membershipCardNumber: 'LIB-STU-0001',
          accessionNumber: 'LIB-2025-00001'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('issued');
    });

    it('processes book return and calculates overdue fines if returned late', async () => {
      const overdueIssue = {
        ...mockIssue,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days late
        status: 'issued',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockIssue, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) })
      };

      jest.spyOn(BookCopy, 'findOne').mockResolvedValue(mockCopy);
      jest.spyOn(BookIssue, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(overdueIssue)
      });
      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue({
        finePerDayOverdue: 5
      });
      jest.spyOn(LibraryMember, 'findById').mockResolvedValue(mockMember);
      jest.spyOn(Book, 'findByIdAndUpdate').mockResolvedValue(true);
      jest.spyOn(BookCopy, 'findByIdAndUpdate').mockResolvedValue(true);
      jest.spyOn(LibraryFine, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(LibraryFine, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439160',
        amount: 25,
        daysOverdue: 5,
        status: 'pending'
      });
      jest.spyOn(LibraryMember, 'findByIdAndUpdate').mockResolvedValue(true);
      jest.spyOn(BookReservation, 'find').mockResolvedValue([]);

      const res = await request(app)
        .post('/api/v1/library/returns')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          accessionNumber: 'LIB-2025-00001',
          condition: 'good'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fine).toBeDefined();
      expect(res.body.data.fine.amount).toBe(25);
      expect(res.body.data.fine.daysOverdue).toBe(5);
    });

    it('renews an active loan when within max renewal limits', async () => {
      const renewableIssue = {
        ...mockIssue,
        renewalCount: 0,
        renewCount: 0,
        maxRenewals: 2,
        status: 'issued',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockIssue, renewalCount: 1, renewCount: 1 })
      };

      jest.spyOn(BookIssue, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(renewableIssue)
      });
      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue({
        maxRenewalsAllowed: 2,
        studentLoanPeriodDays: 14
      });
      jest.spyOn(BookReservation, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/library/renewals')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          issueId: mockIssue._id
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.renewCount).toBe(1);
    });
  });

  describe('4. Fines & Authorized Waivers', () => {
    it('allows Librarian to record fine payment', async () => {
      const mockFine = {
        _id: '507f1f77bcf86cd799439170',
        amount: 50,
        paidAmount: 0,
        status: 'pending',
        member: mockMember._id,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(LibraryFine, 'findById').mockResolvedValue(mockFine);
      jest.spyOn(LibraryMember, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/library/fines/pay')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          fineId: mockFine._id,
          amount: 50,
          paymentReference: 'REC-1001'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('paid');
    });

    it('allows Librarian to waive fine with mandatory reason and audit entry', async () => {
      const mockFine = {
        _id: '507f1f77bcf86cd799439170',
        amount: 30,
        status: 'pending',
        member: mockMember._id,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(LibraryFine, 'findById').mockResolvedValue(mockFine);
      jest.spyOn(LibraryMember, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/library/fines/waive')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          fineId: mockFine._id,
          reason: 'Medical exemption verified by Academic Dean'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('waived');
      expect(res.body.data.waiverReason).toBe('Medical exemption verified by Academic Dean');
    });

    it('rejects fine waiver if reason is omitted', async () => {
      const res = await request(app)
        .post('/api/v1/library/fines/waive')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          fineId: '507f1f77bcf86cd799439170',
          reason: '   '
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Waiver reason is required and must be justified');
    });
  });

  describe('5. Digital Learning Resources Catalog', () => {
    it('catalogs e-resource and records download count', async () => {
      const mockResource = {
        _id: '507f1f77bcf86cd799439180',
        title: 'Algorithms 4th Edition PDF',
        author: 'Robert Sedgewick',
        resourceType: 'pdf',
        fileUrl: 'https://example.com/algorithms.pdf',
        downloadCount: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(DigitalResource, 'create').mockResolvedValue(mockResource);
      jest.spyOn(DigitalResource, 'findByIdAndUpdate').mockResolvedValue({
        ...mockResource,
        downloadCount: 6
      });

      const createRes = await request(app)
        .post('/api/v1/library/digital-resources')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Algorithms 4th Edition PDF',
          author: 'Robert Sedgewick',
          resourceType: 'pdf',
          fileUrl: 'https://example.com/algorithms.pdf'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);

      const downloadRes = await request(app)
        .post(`/api/v1/library/digital-resources/${mockResource._id}/download`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.body.success).toBe(true);
      expect(downloadRes.body.data.downloadCount).toBe(6);
    });
  });

  describe('6. Library Settings Configuration', () => {
    it('updates library loan parameters and borrowing policies', async () => {
      const mockSettings = {
        finePerDayOverdue: 5,
        finePerDay: 5,
        studentLoanPeriodDays: 14,
        defaultLoanPeriodDays: 14,
        studentMaxBooks: 3,
        maxBooksAllowedStudent: 3,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue(mockSettings);

      const res = await request(app)
        .put('/api/v1/library/settings')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          finePerDay: 10,
          defaultLoanPeriodDays: 21,
          maxBooksAllowedStudent: 4
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.finePerDay).toBe(10);
      expect(res.body.data.defaultLoanPeriodDays).toBe(21);
      expect(res.body.data.maxBooksAllowedStudent).toBe(4);
    });
  });

  describe('7. CSV Reports Export', () => {
    it('exports library CSV inventory report with proper headers', async () => {
      jest.spyOn(Book, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockBook])
      });

      const res = await request(app)
        .get('/api/v1/library/reports?type=inventory')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Title,Author,Publisher,ISBN');
      expect(res.text).toContain('Clean Code');
    });
  });
});
