const request = require('supertest');
const app = require('../src/app');
const User = require('../src/modules/auth/auth.model');
const { ROLES } = require('@college-erp/shared');

describe('Comprehensive Multi-Role & Librarian Authentication Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const testRoles = [
    { role: ROLES.SUPER_ADMIN, email: 'admin@college.edu', name: 'Dr. Arthur Mitchell' },
    { role: ROLES.PRINCIPAL, email: 'principal@college.edu', name: 'Dr. Eleanor Vance' },
    { role: ROLES.HOD, email: 'hod.cse@college.edu', name: 'Prof. David Kumar' },
    { role: ROLES.FACULTY, email: 'faculty.turing@college.edu', name: 'Dr. Alan Turing' },
    { role: ROLES.STUDENT, email: 'student.aarav@college.edu', name: 'Aarav Sharma' },
    { role: ROLES.ACCOUNTS, email: 'accounts@college.edu', name: 'Mr. Robert Sterling' },
    { role: ROLES.LIBRARIAN, email: 'librarian@college.edu', name: 'Mrs. Evelyn Reed' }
  ];

  testRoles.forEach(({ role, email, name }) => {
    it(`authenticates ${role} successfully with valid credentials and matching role`, async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439099',
        name,
        email,
        role,
        status: 'active',
        department: 'College ERP',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'ValidPassword123!',
          role
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe(role);
      expect(res.body).toHaveProperty('token');
    });
  });

  it('authenticates Librarian with role alias "Chief Librarian"', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439098',
      name: 'Mrs. Evelyn Reed',
      email: 'librarian@college.edu',
      role: ROLES.LIBRARIAN,
      status: 'active',
      department: 'Central Library',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'librarian@college.edu',
        password: 'Library@2026#',
        role: 'Chief Librarian'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe(ROLES.LIBRARIAN);
  });

  it('authenticates Librarian when using institutionalRole field', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439097',
      name: 'Mrs. Evelyn Reed',
      email: 'librarian@college.edu',
      role: ROLES.LIBRARIAN,
      status: 'active',
      department: 'Central Library',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'librarian@college.edu',
        password: 'Library@2026#',
        institutionalRole: 'librarian'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe(ROLES.LIBRARIAN);
  });

  it('rejects Librarian login when password is incorrect (401 Unauthorized)', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439096',
      name: 'Mrs. Evelyn Reed',
      email: 'librarian@college.edu',
      role: ROLES.LIBRARIAN,
      status: 'active',
      department: 'Central Library',
      comparePassword: jest.fn().mockResolvedValue(false)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'librarian@college.edu',
        password: 'WrongPassword!',
        role: ROLES.LIBRARIAN
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password credentials.');
  });

  it('rejects login when role mismatches (401 Unauthorized)', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439095',
      name: 'Mrs. Evelyn Reed',
      email: 'librarian@college.edu',
      role: ROLES.LIBRARIAN,
      status: 'active',
      department: 'Central Library',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'librarian@college.edu',
        password: 'Library@2026#',
        role: ROLES.PRINCIPAL
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Role mismatch');
    expect(res.body.registeredRole).toBe(ROLES.LIBRARIAN);
  });

  it('rejects login with completely invalid role with 400 Bad Request and validation error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'librarian@college.edu',
        password: 'Library@2026#',
        role: 'unauthorized_role_xyz'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Request validation failed');
    expect(res.body.errors[0]).toContain('Role must be one of:');
  });
});

