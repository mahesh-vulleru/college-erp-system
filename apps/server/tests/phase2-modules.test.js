const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/modules/auth/auth.model');
const Student = require('../src/modules/students/student.model');
const ParentStudentLink = require('../src/modules/students/parentStudentLink.model');
const Attendance = require('../src/modules/attendance/attendance.model');
const Result = require('../src/modules/results/result.model');
const Invoice = require('../src/modules/fees/invoice.model');
const Payment = require('../src/modules/payments/payment.model');
const { BookIssue, LibraryFine } = require('../src/modules/library/models');
const { StudentTransportAllocation } = require('../src/modules/transport/models');
const HelpdeskTicket = require('../src/modules/helpdesk/ticket.model');
const FacultySubstitution = require('../src/modules/faculty/substitution.model');
const Timetable = require('../src/modules/timetable/timetable.model');
const Examination = require('../src/modules/examinations/exam.model');
const ExamSeating = require('../src/modules/examinations/examSeating.model');
const Document = require('../src/modules/documents/document.model');
const { ROLES } = require('@college-erp/shared');

describe('Phase 2 Core Functional Modules Test Suite', () => {
  const superAdminUser = {
    _id: '507f1f77bcf86cd799439201',
    name: 'Super Administrator',
    email: 'admin.p2@college.edu',
    role: ROLES.SUPER_ADMIN,
    status: 'active'
  };

  const parentUser = {
    _id: '507f1f77bcf86cd799439202',
    name: 'Parent Sharma',
    email: 'parent.sharma@gmail.com',
    role: ROLES.PARENT,
    status: 'active'
  };

  const unlinkedParentUser = {
    _id: '507f1f77bcf86cd799439203',
    name: 'Unlinked Parent Verma',
    email: 'parent.verma@gmail.com',
    role: ROLES.PARENT,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439204',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const facultyUser = {
    _id: '507f1f77bcf86cd799439205',
    name: 'Dr. Alan Turing',
    email: 'turing.p2@college.edu',
    role: ROLES.FACULTY,
    status: 'active'
  };

  const hodUser = {
    _id: '507f1f77bcf86cd799439206',
    name: 'HOD CSE',
    email: 'hod.p2@college.edu',
    role: ROLES.HOD,
    status: 'active'
  };

  const accountsUser = {
    _id: '507f1f77bcf86cd799439207',
    name: 'Finance Officer',
    email: 'accounts.p2@college.edu',
    role: ROLES.ACCOUNTS,
    status: 'active'
  };

  const superAdminToken = jwt.sign({ id: superAdminUser._id, role: superAdminUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const parentToken = jwt.sign({ id: parentUser._id, role: parentUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const unlinkedParentToken = jwt.sign({ id: unlinkedParentUser._id, role: unlinkedParentUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const studentToken = jwt.sign({ id: studentUser._id, role: studentUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const facultyToken = jwt.sign({ id: facultyUser._id, role: facultyUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const hodToken = jwt.sign({ id: hodUser._id, role: hodUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const accountsToken = jwt.sign({ id: accountsUser._id, role: accountsUser.role }, env.JWT_SECRET, { expiresIn: '1h' });

  const mockStudent = {
    _id: '607f1f77bcf86cd799439210',
    user: studentUser,
    rollNumber: 'CSE-2026-001',
    enrollmentNumber: 'EN-2026-001',
    currentSemester: 4,
    batchYear: '2024-2028',
    admissionStatus: 'enrolled',
    department: { _id: '607f1f77bcf86cd799439220', name: 'Computer Science', code: 'CSE' },
    course: { _id: '607f1f77bcf86cd799439221', name: 'B.Tech CSE', code: 'BT-CSE' }
  };

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = String(id);
      let u = superAdminUser;
      if (idStr === String(parentUser._id)) u = parentUser;
      else if (idStr === String(unlinkedParentUser._id)) u = unlinkedParentUser;
      else if (idStr === String(studentUser._id)) u = studentUser;
      else if (idStr === String(facultyUser._id)) u = facultyUser;
      else if (idStr === String(hodUser._id)) u = hodUser;
      else if (idStr === String(accountsUser._id)) u = accountsUser;

      return {
        select: jest.fn().mockResolvedValue(u)
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // 1. MODULE 12: PARENT-STUDENT DATA LINKAGE
  // =========================================================================
  describe('Module 12: Parent-Student Data Linkage', () => {
    it('allows Super Admin to link a parent user to a student profile', async () => {
      jest.spyOn(User, 'findById').mockImplementation((id) => {
        if (String(id) === String(parentUser._id)) return Promise.resolve(parentUser);
        return { select: jest.fn().mockResolvedValue(superAdminUser) };
      });
      jest.spyOn(Student, 'findById').mockResolvedValue(mockStudent);
      jest.spyOn(ParentStudentLink, 'findOne').mockResolvedValue(null);
      jest.spyOn(ParentStudentLink, 'create').mockResolvedValue({
        _id: '707f1f77bcf86cd799439230',
        parent: parentUser._id,
        student: mockStudent._id,
        relationship: 'Father',
        isPrimary: true,
        status: 'active'
      });

      const res = await request(app)
        .post('/api/v1/parent-links')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          parentId: parentUser._id,
          studentId: mockStudent._id,
          relationship: 'Father',
          isPrimary: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.relationship).toBe('Father');
    });

    it('rejects linking when parent user does not possess PARENT role', async () => {
      jest.spyOn(User, 'findById').mockImplementation((id) => {
        if (String(id) === String(facultyUser._id)) return Promise.resolve(facultyUser);
        return { select: jest.fn().mockResolvedValue(superAdminUser) };
      });

      const res = await request(app)
        .post('/api/v1/parent-links')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          parentId: facultyUser._id,
          studentId: mockStudent._id
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/role "parent" is required/i);
    });

    it('allows Parent to list their verified children via /api/v1/parent/my-children', async () => {
      jest.spyOn(ParentStudentLink, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: '707f1f77bcf86cd799439230',
                relationship: 'Father',
                isPrimary: true,
                student: mockStudent
              }
            ])
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/parent/my-children')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].rollNumber).toBe('CSE-2026-001');
    });
  });

  // =========================================================================
  // 2. MODULE 1: STUDENT 360° PROFILE
  // =========================================================================
  describe('Module 1: Student 360° Profile', () => {
    it('allows Student to retrieve own 360 profile via /api/v1/students/me/360', async () => {
      jest.spyOn(Student, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockStudent)
      });
      jest.spyOn(Attendance, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Result, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Invoice, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Payment, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(BookIssue, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(LibraryFine, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(StudentTransportAllocation, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .get('/api/v1/students/me/360')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.rollNumber).toBe('CSE-2026-001');
      expect(res.body.data.attendance).toBeDefined();
      expect(res.body.data.academics).toBeDefined();
      expect(res.body.data.finances).toBeDefined();
    });

    it('strictly forbids unlinked Parent from accessing student 360 profile with 403 Forbidden', async () => {
      const chain = {
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockStudent)
      };
      jest.spyOn(Student, 'findById').mockReturnValue(chain);
      jest.spyOn(ParentStudentLink, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/students/${mockStudent._id}/360`)
        .set('Authorization', `Bearer ${unlinkedParentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  // =========================================================================
  // 3. MODULE 3: GRIEVANCES & HELPDESK
  // =========================================================================
  describe('Module 3: Grievances & Helpdesk', () => {
    it('allows any authenticated role to submit a helpdesk ticket', async () => {
      jest.spyOn(HelpdeskTicket, 'create').mockResolvedValue({
        _id: '807f1f77bcf86cd799439240',
        ticketNumber: 'TKT-2026-00001',
        title: 'Projector Defect',
        description: 'Projector bulb flickers',
        category: 'Infrastructure & Facilities',
        priority: 'high',
        status: 'open',
        submittedBy: studentUser._id
      });

      const res = await request(app)
        .post('/api/v1/helpdesk')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Projector Defect',
          description: 'Projector bulb flickers',
          category: 'Infrastructure & Facilities',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticketNumber).toBe('TKT-2026-00001');
      expect(res.body.data.status).toBe('open');
    });
  });

  // =========================================================================
  // 4. MODULE 6: FACULTY WORKLOAD & SUBSTITUTION
  // =========================================================================
  describe('Module 6: Faculty Workload & Substitution', () => {
    it('detects timetable conflict when substitute faculty has an overlapping slot', async () => {
      const mockSlot = {
        _id: '907f1f77bcf86cd799439250',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00'
      };

      jest.spyOn(Timetable, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSlot)
      });

      jest.spyOn(Timetable, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          subject: { name: 'Operating Systems' },
          startTime: '09:00',
          endTime: '10:00'
        })
      });

      const res = await request(app)
        .post('/api/v1/faculty/substitutions')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          originalFacultyId: '507f1f77bcf86cd799439205',
          substituteFacultyId: '507f1f77bcf86cd799439206',
          timetableSlotId: mockSlot._id,
          date: '2026-11-09',
          reason: 'Academic summit'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/conflict detected/i);
    });
  });

  // =========================================================================
  // 5. MODULE 7: EXAMINATION SEATING MANAGEMENT
  // =========================================================================
  describe('Module 7: Examination Seating Management', () => {
    it('rejects seating plan when student allocation exceeds room capacity', async () => {
      jest.spyOn(Examination, 'findById').mockResolvedValue({ _id: '107f1f77bcf86cd799439260' });

      const res = await request(app)
        .post('/api/v1/examinations/seating')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          examinationId: '107f1f77bcf86cd799439260',
          hallName: 'Room 101',
          roomNumber: 'R-101',
          totalRows: 1,
          seatsPerRow: 2,
          allocations: [
            { student: '1', rollNumber: 'R1', row: 1, column: 1 },
            { student: '2', rollNumber: 'R2', row: 1, column: 2 },
            { student: '3', rollNumber: 'R3', row: 1, column: 3 }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/capacity violation/i);
    });
  });

  // =========================================================================
  // 6. MODULE 8: FEE RECONCILIATION
  // =========================================================================
  describe('Module 8: Fee Reconciliation', () => {
    it('allows Accounts role to retrieve fee reconciliation metrics', async () => {
      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: '207f1f77bcf86cd799439270',
              receiptNumber: 'RCP-001',
              amountPaid: 50000,
              reconciliationStatus: 'reconciled'
            }
          ])
        })
      });

      const res = await request(app)
        .get('/api/v1/payments/reconciliation')
        .set('Authorization', `Bearer ${accountsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalPaymentsCount).toBe(1);
      expect(res.body.data.metrics.reconciledAmount).toBe(50000);
    });
  });

  // =========================================================================
  // 7. MODULE 11: DOCUMENT MANAGEMENT
  // =========================================================================
  describe('Module 11: Document Management', () => {
    it('allows Student to upload a document and generates secure fileKey', async () => {
      jest.spyOn(Document, 'create').mockResolvedValue({
        _id: '307f1f77bcf86cd799439280',
        title: 'Semester Grade Sheet',
        category: 'Student Academic',
        fileKey: 'doc_123456_grade.pdf',
        status: 'active'
      });

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Semester Grade Sheet',
          category: 'Student Academic',
          originalName: 'grade.pdf',
          mimeType: 'application/pdf',
          fileSize: 102400
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileKey).toBeDefined();
    });
  });
});
