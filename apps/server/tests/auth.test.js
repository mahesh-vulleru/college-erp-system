const request = require('supertest');
const app = require('../src/app');
const User = require('../src/modules/auth/auth.model');
const { ROLES, ALL_ROLES } = require('@college-erp/shared');

describe('Authentication Validation & Role Mismatch Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/v1/auth/login with missing email should return 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        password: 'password123',
        role: ROLES.STUDENT
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain('Email address is required');
  });

  it('POST /api/v1/auth/login with invalid email format should return 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email-format',
        password: 'password123',
        role: ROLES.STUDENT
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain('Please enter a valid email address');
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
    expect(res.body.errors).toContain(`Role must be one of: ${ALL_ROLES.join(', ')}`);
  });

  it('POST /api/v1/auth/login rejects role mismatch with 401 Unauthorized', async () => {
    // Mock User.findOne to return a student user
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Student',
      email: 'student@college.edu',
      role: ROLES.STUDENT,
      status: 'active',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@college.edu',
        password: 'CorrectPassword123',
        role: ROLES.FACULTY // Deliberate mismatch
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Role mismatch');
    expect(res.body.registeredRole).toBe(ROLES.STUDENT);
  });

  it('POST /api/v1/auth/login succeeds when credentials and role match', async () => {
    const mockPrincipal = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Dr. Eleanor Vance',
      email: 'principal@college.edu',
      role: ROLES.PRINCIPAL,
      status: 'active',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockPrincipal)
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
    expect(res.body.data.user.role).toBe(ROLES.PRINCIPAL);
    expect(res.body.data.token).toBeDefined();
  });
});
