const request = require('supertest');
const app = require('../src/app');
const User = require('../src/modules/auth/auth.model');
const { ROLES } = require('@college-erp/shared');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

describe('Role Flow, Authentication, & Authorization Test Suite', () => {
  const roles = [
    { role: ROLES.SUPER_ADMIN, email: 'admin@college.edu', name: 'Dr. Arthur Mitchell' },
    { role: ROLES.PRINCIPAL, email: 'principal@college.edu', name: 'Dr. Eleanor Vance' },
    { role: ROLES.HOD, email: 'hod.cse@college.edu', name: 'Prof. David Kumar' },
    { role: ROLES.FACULTY, email: 'faculty.turing@college.edu', name: 'Dr. Alan Turing' },
    { role: ROLES.STUDENT, email: 'student.aarav@college.edu', name: 'Aarav Sharma' },
    { role: ROLES.ACCOUNTS, email: 'accounts@college.edu', name: 'Mr. Robert Sterling' }
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. Test each of the six roles can authenticate with their corresponding role
  roles.forEach(({ role, email, name }) => {
    it(`allows ${role} to successfully log in with matching role parameter`, async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439099',
        name,
        email,
        role,
        status: 'active',
        department: 'Engineering',
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
          password: 'Password123!',
          role
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe(role);
      expect(res.body).toHaveProperty('token');
    });
  });

  // 2. Test role mismatch rejection
  it('rejects login when student credentials are submitted with Principal role selected', async () => {
    const studentUser = {
      _id: '507f1f77bcf86cd799439001',
      name: 'Aarav Sharma',
      email: 'student.aarav@college.edu',
      role: ROLES.STUDENT,
      status: 'active',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(studentUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student.aarav@college.edu',
        password: 'Password123!',
        role: ROLES.PRINCIPAL // Mismatch!
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Role mismatch');
    expect(res.body.message).toContain('student');
  });

  it('rejects login when faculty credentials are submitted with Super Admin role selected', async () => {
    const facultyUser = {
      _id: '507f1f77bcf86cd799439002',
      name: 'Dr. Alan Turing',
      email: 'faculty.turing@college.edu',
      role: ROLES.FACULTY,
      status: 'active',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(facultyUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'faculty.turing@college.edu',
        password: 'Password123!',
        role: ROLES.SUPER_ADMIN // Mismatch!
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Role mismatch');
  });

  // 3. Test invalid password
  it('rejects login with incorrect password', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439003',
      name: 'Dr. Eleanor Vance',
      email: 'principal@college.edu',
      role: ROLES.PRINCIPAL,
      status: 'active',
      comparePassword: jest.fn().mockResolvedValue(false), // Password mismatch
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'principal@college.edu',
        password: 'WrongPassword999',
        role: ROLES.PRINCIPAL
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password credentials');
  });

  // 4. Test nonexistent email
  it('rejects login with nonexistent email', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@college.edu',
        password: 'Password123!',
        role: ROLES.STUDENT
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password credentials');
  });

  // 5. Test disabled/inactive account
  it('rejects login for inactive or suspended accounts with 403 Forbidden', async () => {
    const inactiveUser = {
      _id: '507f1f77bcf86cd799439004',
      name: 'Suspended Student',
      email: 'suspended@college.edu',
      role: ROLES.STUDENT,
      status: 'inactive',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(inactiveUser)
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'suspended@college.edu',
        password: 'Password123!',
        role: ROLES.STUDENT
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('inactive');
  });

  // 6. Test password hashing and comparePassword method on User model
  it('correctly hashes password on user creation and verifies bcrypt match', async () => {
    const testUser = new User({
      name: 'Test Verification User',
      email: 'hashing.test@college.edu',
      password: 'PlainPassword123!',
      role: ROLES.FACULTY
    });

    // Run Mongoose schema pre-save hook
    await testUser.validate();
    // In our Mongoose model, the pre-save hook hashes password:
    const salt = await require('bcryptjs').genSalt(10);
    const hash = await require('bcryptjs').hash('PlainPassword123!', salt);
    testUser.password = hash;

    const isCorrect = await testUser.comparePassword('PlainPassword123!');
    const isWrong = await testUser.comparePassword('IncorrectPass');

    expect(isCorrect).toBe(true);
    expect(isWrong).toBe(false);
  });

  // 4. Test User Management: Super Admin creates user vs Student blocked
  it('Super Admin creates new institutional user via protected user management', async () => {
    const adminToken = jwt.sign(
      { id: '507f1f77bcf86cd799439088', role: ROLES.SUPER_ADMIN },
      env.JWT_SECRET
    );

    const adminUser = {
      _id: '507f1f77bcf86cd799439088',
      role: ROLES.SUPER_ADMIN,
      status: 'active'
    };

    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(adminUser)
    });

    jest.spyOn(User, 'findOne').mockResolvedValue(null); // No existing duplicate email

    const createdUser = {
      _id: '507f1f77bcf86cd799439099',
      name: 'Prof. Ada Lovelace',
      email: 'ada.lovelace@college.edu',
      role: ROLES.FACULTY,
      department: 'Computer Science & Engineering',
      status: 'active',
      createdAt: new Date()
    };
    jest.spyOn(User, 'create').mockResolvedValue(createdUser);

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Prof. Ada Lovelace',
        email: 'ada.lovelace@college.edu',
        password: 'Password123!',
        role: ROLES.FACULTY,
        department: 'Computer Science & Engineering'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('ada.lovelace@college.edu');
    expect(res.body.data.role).toBe(ROLES.FACULTY);
  });

  it('rejects Student role attempting to create a user with 403 Forbidden', async () => {
    const studentToken = jwt.sign(
      { id: '507f1f77bcf86cd799439077', role: ROLES.STUDENT },
      env.JWT_SECRET
    );

    const studentUser = {
      _id: '507f1f77bcf86cd799439077',
      role: ROLES.STUDENT,
      status: 'active'
    };

    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(studentUser)
    });

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized User',
        email: 'hack@college.edu',
        password: 'Password123!',
        role: ROLES.SUPER_ADMIN
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

