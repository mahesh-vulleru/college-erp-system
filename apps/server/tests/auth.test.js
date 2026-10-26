const request = require('supertest');
const app = require('../src/app');
const User = require('../src/modules/auth/auth.model');
const { ROLES } = require('@college-erp/shared');

describe('Authentication Validation & Role Mismatch Tests', () => {
  it('POST /api/v1/auth/login with missing body should fail with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/auth/login with invalid email format should return 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email-address',
        password: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain('Please provide a valid email format');
  });

  it('POST /api/v1/auth/login with invalid role should return 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@college.edu',
        password: 'password123',
        role: 'invalid_role_type'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain(`Role must be one of: super_admin, principal, hod, faculty, student, accounts`);
  });

  it('POST /api/v1/auth/login rejects role mismatch with 401 Unauthorized', async () => {
    // Mock User.findOne to return a student user
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Student',
      email: 'student@college.edu',
      role: ROLES.STUDENT,
      status: 'active',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };
    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Attempt to log in with role 'faculty' (mismatch!)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@college.edu',
        password: 'Password123!',
        role: ROLES.FACULTY
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Role mismatch');

    User.findOne.mockRestore();
  });

  it('POST /api/v1/auth/login succeeds with matching role credentials', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Dr. Principal',
      email: 'principal@college.edu',
      role: ROLES.PRINCIPAL,
      status: 'active',
      department: 'Administration',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };
    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'principal@college.edu',
        password: 'Password123!',
        role: ROLES.PRINCIPAL
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe(ROLES.PRINCIPAL);

    User.findOne.mockRestore();
  });

  it('GET /api/v1/auth/me without Bearer token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Bearer token missing');
  });
});
