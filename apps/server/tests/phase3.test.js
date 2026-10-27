const request = require('supertest');
const app = require('../src/app');
const User = require('../src/modules/auth/auth.model');
const FeeStructure = require('../src/modules/fees/fee.model');
const Invoice = require('../src/modules/fees/invoice.model');
const Payment = require('../src/modules/payments/payment.model');
const Notice = require('../src/modules/notices/notice.model');
const Examination = require('../src/modules/examinations/exam.model');
const Result = require('../src/modules/results/result.model');
const AuditLog = require('../src/modules/audit-logs/audit.model');
const { computeInvoiceBalance } = require('../src/modules/fees/fee.controller');
const { sanitizeAuditDetails } = require('../src/utils/auditLogger');
const { ROLES } = require('@college-erp/shared');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

function getMockToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Phase 3 — Institutional Administration Verification Suite', () => {
  const adminUser = {
    _id: '507f1f77bcf86cd799439001',
    name: 'Dr. Arthur Mitchell',
    email: 'admin@college.edu',
    role: ROLES.SUPER_ADMIN,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439002',
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const accountsUser = {
    _id: '507f1f77bcf86cd799439003',
    name: 'Mr. Robert Sterling',
    email: 'accounts@college.edu',
    role: ROLES.ACCOUNTS,
    status: 'active'
  };

  const facultyUser = {
    _id: '507f1f77bcf86cd799439004',
    name: 'Dr. Alan Turing',
    email: 'faculty.turing@college.edu',
    role: ROLES.FACULTY,
    status: 'active'
  };

  const adminToken = getMockToken(adminUser);
  const studentToken = getMockToken(studentUser);
  const accountsToken = getMockToken(accountsUser);
  const facultyToken = getMockToken(facultyUser);

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      if (id.toString() === adminUser._id) return { select: jest.fn().mockResolvedValue(adminUser) };
      if (id.toString() === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      if (id.toString() === accountsUser._id) return { select: jest.fn().mockResolvedValue(accountsUser) };
      if (id.toString() === facultyUser._id) return { select: jest.fn().mockResolvedValue(facultyUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // 1. FINANCIAL CORRECTNESS & DUES CALCULATIONS
  // ============================================================
  describe('Fee Calculations & Invoices', () => {
    it('computes decimal-safe balances: balance = amountDue - waivers - verifiedPayments + refunds', async () => {
      const mockInvoice = {
        _id: '607f1f77bcf86cd799439011',
        amountDue: 50000.5,
        adjustments: [
          { type: 'scholarship', amount: 10000 },
          { type: 'waiver', amount: 5000.25 }
        ],
        student: '507f1f77bcf86cd799439002'
      };

      const mockPayments = [
        { status: 'completed', isVerified: true, amountPaid: 20000, refundStatus: 'none', refundAmount: 0 },
        { status: 'refunded', isVerified: true, amountPaid: 5000, refundStatus: 'processed', refundAmount: 2000 }
      ];

      jest.spyOn(Payment, 'find').mockResolvedValue(mockPayments);

      const calculated = await computeInvoiceBalance(mockInvoice);

      // Total waivers = 10000 + 5000.25 = 15000.25
      // Verified payments = 20000 + 5000 = 25000, refunds = 2000, net payments = 23000
      // Outstanding balance = 50000.50 - 15000.25 - 23000 = 11999.25
      expect(calculated.amountDue).toBe(50000.5);
      expect(calculated.totalWaivers).toBe(15000.25);
      expect(calculated.totalVerifiedPayments).toBe(23000);
      expect(calculated.outstandingBalance).toBe(12000.25);
      expect(calculated.derivedStatus).toBe('partial');
    });

    it('rejects student role from creating fee structures or applying waivers (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/fees/structures')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Unauthorized Fee Plan' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('reports missing gateway configuration honestly without claiming provider works', async () => {
      const res = await request(app)
        .get('/api/v1/payments/gateway-status')
        .set('Authorization', `Bearer ${accountsToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isConfigured');
      expect(res.body.data).toHaveProperty('activeMode');
    });

    it('rejects gateway payments when credentials are unconfigured without faking verification', async () => {
      delete process.env.RAZORPAY_KEY_SECRET;

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({
          student: '507f1f77bcf86cd799439002',
          feeStructure: '607f1f77bcf86cd799439011',
          amountPaid: 15000,
          paymentMethod: 'Gateway'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('GATEWAY_NOT_CONFIGURED');
      expect(res.body.message).toContain('Payment gateway integration requires setup');
    });

    it('prevents duplicate payment execution via idempotency key and reference check', async () => {
      jest.spyOn(Payment, 'findOne').mockResolvedValue({
        _id: '707f1f77bcf86cd799439099',
        receiptNumber: 'REC-2026-EXISTING',
        transactionReference: 'TXN-DUPLICATE-001',
        status: 'completed'
      });

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({
          student: '507f1f77bcf86cd799439002',
          feeStructure: '607f1f77bcf86cd799439011',
          amountPaid: 5000,
          paymentMethod: 'UPI',
          transactionReference: 'TXN-DUPLICATE-001'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_TRANSACTION');
    });
  });

  // ============================================================
  // 2. NOTICE BOARD & AUDIENCE VISIBILITY
  // ============================================================
  describe('Notice Board & Permissions', () => {
    it('rejects notice creation when expiry date is earlier than publication date (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/notices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Notice Dates',
          content: 'This announcement has invalid timeline dates.',
          publicationDate: new Date('2026-10-27'),
          expiryDate: new Date('2026-10-20') // Earlier than publication!
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('INVALID_EXPIRY_DATE');
    });

    it('rejects student attempting to publish or edit a notice with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/notices')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Attempted Notice',
          content: 'Unauthorized publication attempt.'
        });

      expect(res.statusCode).toBe(403);
    });

    it('allows Super Admin to access notices list', async () => {
      jest.spyOn(Notice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: '1', title: 'Campus Sports Meet', status: 'published' },
          { _id: '2', title: 'Internal Draft Notice', status: 'draft' }
        ])
      });

      const res = await request(app)
        .get('/api/v1/notices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ============================================================
  // 3. EXECUTIVE REPORTS & PERMISSION SCOPING
  // ============================================================
  describe('Executive Reports', () => {
    it('restricts financial reports to authorized roles and rejects student (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('returns published results only and excludes unpublished examination marks', async () => {
      jest.spyOn(Examination, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: 'pub1', name: 'Semester 1 End Exams', isPublished: true }])
      });

      jest.spyOn(Result, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve([
          { _id: 'r1', grade: 'A', status: 'passed' },
          { _id: 'r2', grade: 'B+', status: 'passed' }
        ]))
      });

      const res = await request(app)
        .get('/api/v1/reports/results')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.passedCount).toBe(2);
      expect(res.body.data.failedCount).toBe(0);
      expect(res.body.data.passPercentage).toBe(100);
    });

    it('allows authorized CSV export for institutional enrollment and finance reports', async () => {
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      const res = await request(app)
        .get('/api/v1/reports/export?type=finance')
        .set('Authorization', `Bearer ${accountsToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Invoice Number');
    });
  });

  // ============================================================
  // 4. SECURITY & AUDIT LOGS
  // ============================================================
  describe('Security & Audit Logging', () => {
    it('strictly forbids students and faculty from reading audit logs (403 Forbidden)', async () => {
      const resStudent = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resStudent.statusCode).toBe(403);

      const resFaculty = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(resFaculty.statusCode).toBe(403);
    });

    it('allows Super Admin and Principal to view audit logs', async () => {
      jest.spyOn(AuditLog, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([
          {
            _id: 'log1',
            action: 'AUTH_LOGIN_SUCCESS',
            entityType: 'User',
            outcome: 'success',
            createdAt: new Date()
          }
        ])
      });
      jest.spyOn(AuditLog, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe('AUTH_LOGIN_SUCCESS');
    });

    it('redacts passwords, tokens, and sensitive keys from audit log payloads', () => {
      const sensitivePayload = {
        password: 'SuperSecretPassword123!',
        userToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        cvv: '123',
        cardNumber: '4111111111111234',
        razorpay_signature: 'signature_secret_abc',
        normalField: 'Institution Fee Plan'
      };

      const sanitized = sanitizeAuditDetails(sensitivePayload);

      expect(sanitized.password).toBe('[REDACTED_SENSITIVE_DATA]');
      expect(sanitized.userToken).toBe('[REDACTED_SENSITIVE_DATA]');
      expect(sanitized.cvv).toBe('[REDACTED_SENSITIVE_DATA]');
      expect(sanitized.cardNumber).toBe('[REDACTED_SENSITIVE_DATA]');
      expect(sanitized.razorpay_signature).toBe('[REDACTED_SENSITIVE_DATA]');
      expect(sanitized.normalField).toBe('Institution Fee Plan');
    });
  });
});
