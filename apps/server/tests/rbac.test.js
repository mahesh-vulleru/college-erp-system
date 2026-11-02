const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/modules/auth/auth.model');
const { authorizeRoles, requirePermissions } = require('../src/middleware/rbac');
const { ROLES, PERMISSIONS } = require('@college-erp/shared');

describe('RBAC Middleware Authorization Tests', () => {
  let mockApp;

  beforeAll(() => {
    mockApp = express();
    mockApp.use(express.json());

    // Mock auth middleware simulator attaching req.user
    mockApp.use((req, res, next) => {
      const simulatedRole = req.headers['x-simulated-role'];
      if (simulatedRole) {
        req.user = {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test Actor',
          email: 'test@college.edu',
          role: simulatedRole
        };
      }
      next();
    });

    // Protected route requiring Super Admin or Principal
    mockApp.get(
      '/admin-only',
      authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
      (req, res) => res.status(200).json({ success: true, message: 'Granted' })
    );

    // Protected route requiring specific permission (e.g. ATTENDANCE_MARK)
    mockApp.post(
      '/attendance-mark',
      requirePermissions(PERMISSIONS.ATTENDANCE_MARK),
      (req, res) => res.status(200).json({ success: true, message: 'Granted' })
    );
  });

  it('rejects unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(mockApp).get('/admin-only');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unauthorized role (Student accessing Admin route) with 403 Forbidden', async () => {
    const res = await request(mockApp)
      .get('/admin-only')
      .set('x-simulated-role', ROLES.STUDENT);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('does not have permission');
  });

  it('allows authorized role (Principal accessing Admin route) with 200 OK', async () => {
    const res = await request(mockApp)
      .get('/admin-only')
      .set('x-simulated-role', ROLES.PRINCIPAL);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects Student role attempting to mark attendance with 403 Forbidden', async () => {
    const res = await request(mockApp)
      .post('/attendance-mark')
      .set('x-simulated-role', ROLES.STUDENT);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient permissions');
  });

  it('allows Faculty role possessing ATTENDANCE_MARK permission with 200 OK', async () => {
    const res = await request(mockApp)
      .post('/attendance-mark')
      .set('x-simulated-role', ROLES.FACULTY);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Rigorous 6-Role System API Access Control Tests', () => {
  const users = {
    [ROLES.SUPER_ADMIN]: {
      _id: '507f1f77bcf86cd799439091',
      name: 'Super Administrator',
      email: 'admin@college.edu',
      role: ROLES.SUPER_ADMIN,
      status: 'active'
    },
    [ROLES.PRINCIPAL]: {
      _id: '507f1f77bcf86cd799439092',
      name: 'Dr. Principal',
      email: 'principal@college.edu',
      role: ROLES.PRINCIPAL,
      status: 'active'
    },
    [ROLES.HOD]: {
      _id: '507f1f77bcf86cd799439093',
      name: 'Prof. HOD CSE',
      email: 'hod@college.edu',
      role: ROLES.HOD,
      department: '507f1f77bcf86cd799439010',
      status: 'active'
    },
    [ROLES.FACULTY]: {
      _id: '507f1f77bcf86cd799439094',
      name: 'Prof. Faculty',
      email: 'faculty@college.edu',
      role: ROLES.FACULTY,
      status: 'active'
    },
    [ROLES.STUDENT]: {
      _id: '507f1f77bcf86cd799439095',
      name: 'Aarav Student',
      email: 'student@college.edu',
      role: ROLES.STUDENT,
      status: 'active'
    },
    [ROLES.ACCOUNTS]: {
      _id: '507f1f77bcf86cd799439096',
      name: 'Accounts Officer',
      email: 'accounts@college.edu',
      role: ROLES.ACCOUNTS,
      status: 'active'
    }
  };

  const tokens = {};
  Object.keys(users).forEach((role) => {
    tokens[role] = jwt.sign(
      { id: users[role]._id, role: users[role].role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      const matched = Object.values(users).find((u) => u._id === idStr);
      return {
        select: jest.fn().mockResolvedValue(matched || null)
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Accounts & Finance Role Isolation', () => {
    const academicEndpoints = [
      '/api/v1/departments',
      '/api/v1/courses',
      '/api/v1/subjects',
      '/api/v1/faculty',
      '/api/v1/timetable',
      '/api/v1/attendance',
      '/api/v1/examinations',
      '/api/v1/results'
    ];

    academicEndpoints.forEach((endpoint) => {
      it(`denies Accounts role from accessing academic endpoint: ${endpoint} with 403 Forbidden`, async () => {
        const res = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${tokens[ROLES.ACCOUNTS]}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Forbidden');
      });
    });

    it('denies Accounts role from exporting academic reports with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export?type=enrollment')
        .set('Authorization', `Bearer ${tokens[ROLES.ACCOUNTS]}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Accounts role can only export financial reports');
    });
  });

  describe('Faculty & HOD Role Isolation from Financial Management', () => {
    const financialEndpoints = [
      '/api/v1/fees/structures',
      '/api/v1/fees/invoices',
      '/api/v1/payments',
      '/api/v1/reports/fee-collection',
      '/api/v1/reports/financial'
    ];

    financialEndpoints.forEach((endpoint) => {
      it(`denies Faculty role from accessing financial endpoint: ${endpoint} with 403 Forbidden`, async () => {
        const res = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${tokens[ROLES.FACULTY]}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Forbidden');
      });

      it(`denies HOD role from accessing financial endpoint: ${endpoint} with 403 Forbidden`, async () => {
        const res = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${tokens[ROLES.HOD]}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Forbidden');
      });
    });

    it('denies HOD role from exporting financial reports with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export?type=finance')
        .set('Authorization', `Bearer ${tokens[ROLES.HOD]}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('HOD role cannot access or export financial');
    });

    it('denies HOD role from creating departments with 403 Forbidden (Super Admin only)', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${tokens[ROLES.HOD]}`)
        .send({ name: 'Robotics Engineering', code: 'ROB' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  describe('Student Role Isolation (IDOR & Privilege Prevention)', () => {
    it('denies Student role from viewing full student registry with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${tokens[ROLES.STUDENT]}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('denies Student role from viewing user management directory with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${tokens[ROLES.STUDENT]}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('denies Student role from marking attendance with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/mark')
        .set('Authorization', `Bearer ${tokens[ROLES.STUDENT]}`)
        .send({
          subject: '507f1f77bcf86cd799439005',
          date: '2026-11-01',
          records: [{ studentId: '507f1f77bcf86cd799439006', status: 'present' }]
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('denies Student role from recording examination results with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/results')
        .set('Authorization', `Bearer ${tokens[ROLES.STUDENT]}`)
        .send({
          examination: '507f1f77bcf86cd799439007',
          student: '507f1f77bcf86cd799439008',
          subject: '507f1f77bcf86cd799439009',
          internalMarks: 25,
          externalMarks: 70
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('denies Student role from creating fee structures with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/fees/structures')
        .set('Authorization', `Bearer ${tokens[ROLES.STUDENT]}`)
        .send({
          title: 'Tuition Fee 2026',
          academicYear: '2026-2027',
          tuitionFee: 50000
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  describe('Unauthenticated Request Protection', () => {
    it('denies access to protected endpoints without JWT token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/departments');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
