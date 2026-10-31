const request = require('supertest');
const app = require('../src/app');
const User = require('../src/modules/auth/auth.model');
const Book = require('../src/modules/library/models/book.model');
const BookCopy = require('../src/modules/library/models/bookCopy.model');
const BookIssue = require('../src/modules/library/models/issue.model');
const BookReservation = require('../src/modules/library/models/reservation.model');
const LibraryMember = require('../src/modules/library/models/member.model');
const LibraryFine = require('../src/modules/library/models/fine.model');
const BookCategory = require('../src/modules/library/models/category.model');
const DigitalResource = require('../src/modules/library/models/digitalResource.model');
const LibrarySetting = require('../src/modules/library/models/setting.model');
const { ROLES } = require('@college-erp/shared');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

function getMockToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' });
}

function mockQuery(result = []) {
  const query = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: function(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };
  return query;
}

describe('Phase 2 — Library Staff Portal & Circulation Desk Security Tests', () => {
  const staffUser = {
    _id: '507f1f77bcf86cd799439077',
    name: 'Mr. Marcus Cole',
    email: 'librarystaff@college.edu',
    role: ROLES.LIBRARY_STAFF,
    status: 'active',
    department: 'Central Library'
  };

  const librarianUser = {
    _id: '507f1f77bcf86cd799439088',
    name: 'Mrs. Evelyn Reed',
    email: 'librarian@college.edu',
    role: ROLES.LIBRARIAN,
    status: 'active',
    department: 'Central Library'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439099',
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    role: ROLES.STUDENT,
    status: 'active',
    department: 'Computer Science & Engineering'
  };

  const staffToken = getMockToken(staffUser);
  const librarianToken = getMockToken(librarianUser);
  const studentToken = getMockToken(studentUser);

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id?.toString();
      if (idStr === staffUser._id) {
        return {
          select: jest.fn().mockResolvedValue({
            ...staffUser,
            toObject: () => staffUser
          })
        };
      }
      if (idStr === librarianUser._id) {
        return {
          select: jest.fn().mockResolvedValue({
            ...librarianUser,
            toObject: () => librarianUser
          })
        };
      }
      if (idStr === studentUser._id) {
        return {
          select: jest.fn().mockResolvedValue({
            ...studentUser,
            toObject: () => studentUser
          })
        };
      }
      return { select: jest.fn().mockResolvedValue(null) };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Authentication & Role Recognition
  // --------------------------------------------------------------------------
  describe('Library Staff Authentication', () => {
    it('authenticates library staff with role library_staff', async () => {
      const mockDbUser = {
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        role: ROLES.LIBRARY_STAFF,
        status: 'active',
        department: staffUser.department,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockDbUser)
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'librarystaff@college.edu',
          password: 'Password123!',
          role: 'library_staff'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe(ROLES.LIBRARY_STAFF);
      expect(res.body).toHaveProperty('token');
    });

    it('authenticates library staff with alias "Library Staff"', async () => {
      const mockDbUser = {
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        role: ROLES.LIBRARY_STAFF,
        status: 'active',
        department: staffUser.department,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockDbUser)
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'librarystaff@college.edu',
          password: 'Password123!',
          role: 'Library Staff'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe(ROLES.LIBRARY_STAFF);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Staff Dashboard & My Transactions
  // --------------------------------------------------------------------------
  describe('Staff Dashboard & Transactions Access', () => {
    it('allows library staff to access GET /api/v1/library/staff-dashboard', async () => {
      jest.spyOn(BookIssue, 'countDocuments').mockResolvedValue(5);
      jest.spyOn(BookReservation, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(BookIssue, 'find').mockReturnValue(mockQuery([]));

      const res = await request(app)
        .get('/api/v1/library/staff-dashboard')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('myActivity');
      expect(res.body.data.summary).toHaveProperty('booksIssuedToday');
      expect(res.body.data.summary).toHaveProperty('booksReturnedToday');
      expect(res.body.data.summary).toHaveProperty('activeTransactions');
    });

    it('allows library staff to access GET /api/v1/library/my-transactions', async () => {
      jest.spyOn(BookIssue, 'find').mockReturnValue(mockQuery([]));
      jest.spyOn(BookIssue, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/library/my-transactions')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects student from accessing staff dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/library/staff-dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Circulation Operations Permissions
  // --------------------------------------------------------------------------
  describe('Circulation Desk Read & Write Permissions', () => {
    it('allows library staff to view books list', async () => {
      jest.spyOn(Book, 'find').mockReturnValue(mockQuery([]));
      jest.spyOn(Book, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/library/books')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows library staff to view circulation issues', async () => {
      jest.spyOn(BookIssue, 'find').mockReturnValue(mockQuery([]));
      jest.spyOn(BookIssue, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/library/issues')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows library staff to read library settings', async () => {
      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue({
        libraryName: 'Central Institutional Library',
        finePerDayOverdue: 5,
        studentMaxBooks: 3,
        facultyMaxBooks: 6
      });

      const res = await request(app)
        .get('/api/v1/library/settings')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.finePerDayOverdue).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Strict Least-Privilege Restrictions (Staff CANNOT perform admin actions)
  // --------------------------------------------------------------------------
  describe('Least-Privilege Enforcement (403 Forbidden on Restricted Actions)', () => {
    it('prevents library staff from modifying library settings (PUT /settings)', async () => {
      const res = await request(app)
        .put('/api/v1/library/settings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          finePerDayOverdue: 20
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not have permission');
    });

    it('prevents library staff from waiving fines (POST /fines/waive)', async () => {
      const res = await request(app)
        .post('/api/v1/library/fines/waive')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fineId: '507f1f77bcf86cd799439055',
          reason: 'Staff waiver attempt'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not have permission');
    });

    it('prevents library staff from adding new books to inventory (POST /books)', async () => {
      const res = await request(app)
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          title: 'Unauthorized Book',
          author: 'Unauthorized Author',
          isbn: '1234567890'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not have permission');
    });

    it('prevents library staff from archiving / deleting books (DELETE /books/:id)', async () => {
      const res = await request(app)
        .delete('/api/v1/library/books/507f1f77bcf86cd799439055')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not have permission');
    });

    it('prevents library staff from exporting audit/inventory reports (GET /reports)', async () => {
      const res = await request(app)
        .get('/api/v1/library/reports?type=inventory')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not have permission');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Librarian Regression Verification (Phase 1 features remain 100% functional)
  // --------------------------------------------------------------------------
  describe('Librarian Role Regression Verification', () => {
    it('allows Librarian to access Phase 1 GET /api/v1/library/dashboard', async () => {
      jest.spyOn(Book, 'countDocuments').mockResolvedValue(100);
      jest.spyOn(BookCopy, 'countDocuments').mockResolvedValue(50);
      jest.spyOn(LibraryMember, 'countDocuments').mockResolvedValue(200);
      jest.spyOn(BookReservation, 'countDocuments').mockResolvedValue(5);
      jest.spyOn(BookIssue, 'countDocuments').mockResolvedValue(5);
      jest.spyOn(BookIssue, 'find').mockReturnValue(mockQuery([]));
      jest.spyOn(LibraryFine, 'find').mockResolvedValue([]);
      jest.spyOn(BookIssue, 'aggregate').mockResolvedValue([]);
      jest.spyOn(BookCategory, 'countDocuments').mockResolvedValue(10);
      jest.spyOn(DigitalResource, 'countDocuments').mockResolvedValue(25);
      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue({
        libraryName: 'Central Institutional Library',
        finePerDayOverdue: 5
      });

      const res = await request(app)
        .get('/api/v1/library/dashboard')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
    });

    it('allows Librarian to update library settings (PUT /settings)', async () => {
      jest.spyOn(LibrarySetting, 'findOne').mockResolvedValue({
        libraryName: 'Central Institutional Library',
        finePerDayOverdue: 5,
        save: jest.fn().mockResolvedValue({
          libraryName: 'Central Institutional Library',
          finePerDayOverdue: 10
        })
      });

      const res = await request(app)
        .put('/api/v1/library/settings')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          finePerDayOverdue: 10
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows Librarian to waive overdue fines (POST /fines/waive)', async () => {
      const mockFine = {
        _id: '507f1f77bcf86cd799439055',
        amount: 50,
        paidAmount: 0,
        waivedAmount: 0,
        status: 'pending',
        member: '507f1f77bcf86cd799439044',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(LibraryFine, 'findById').mockResolvedValue(mockFine);
      jest.spyOn(LibraryMember, 'findByIdAndUpdate').mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/library/fines/waive')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          fineId: '507f1f77bcf86cd799439055',
          reason: 'Valid academic dispensation by Chief Librarian'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Librarian-Managed Staff Account Assignment & Lifecycle
  // --------------------------------------------------------------------------
  describe('Librarian-Managed Staff Account Assignment & Lifecycle', () => {
    it('allows Librarian to list library staff accounts (GET /staff)', async () => {
      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([staffUser])
      });

      const res = await request(app)
        .get('/api/v1/library/staff')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('allows Librarian to create a new Library Staff account (POST /staff)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        name: 'New Staff Member',
        email: 'newstaff@college.edu',
        role: ROLES.LIBRARY_STAFF,
        status: 'active'
      });

      const res = await request(app)
        .post('/api/v1/library/staff')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          name: 'New Staff Member',
          email: 'newstaff@college.edu',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(ROLES.LIBRARY_STAFF);
    });

    it('prevents creating duplicate employee account with same email', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(staffUser);

      const res = await request(app)
        .post('/api/v1/library/staff')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          name: 'Duplicate Staff',
          email: 'librarystaff@college.edu',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('allows Librarian to assign an existing user to Library Staff role', async () => {
      const mockCandidate = {
        _id: '507f1f77bcf86cd799439066',
        name: 'John Assistant',
        email: 'assistant.john@college.edu',
        role: ROLES.FACULTY,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockCandidate);

      const res = await request(app)
        .post('/api/v1/library/staff')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          email: 'assistant.john@college.edu',
          assignExisting: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockCandidate.role).toBe(ROLES.LIBRARY_STAFF);
    });

    it('prevents Library Staff from managing staff accounts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/library/staff')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Unauthorized Staff',
          email: 'unauthorized@college.edu'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not have permission');
    });
  });
});
