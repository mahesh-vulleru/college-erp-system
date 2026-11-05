const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Institution = require('../src/modules/institution/institution.model');

describe('Institution Profile API Test Suite', () => {
  const superAdminUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Super Administrator',
    email: 'admin@college.edu',
    role: ROLES.SUPER_ADMIN,
    status: 'active'
  };

  const principalUser = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    role: ROLES.PRINCIPAL,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Aarav Sharma',
    email: 'aarav@student.college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const superAdminToken = jwt.sign(
    { id: superAdminUser._id, role: superAdminUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const principalToken = jwt.sign(
    { id: principalUser._id, role: principalUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: studentUser._id, role: studentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  let mockInstitutionDoc;

  beforeEach(() => {
    mockInstitutionDoc = {
      _id: '507f1f77bcf86cd799439099',
      name: 'Apex Institute of Technology & Engineering',
      code: 'AITE-500032',
      establishedYear: 2008,
      tagline: 'Excellence in Engineering & Technological Innovation',
      institutionType: 'Autonomous Engineering College',
      logoUrl: '',
      address: {
        line1: 'Survey No. 45/2, Knowledge City Road',
        line2: 'Financial District, Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500032',
        country: 'India'
      },
      contact: {
        email: 'registrar@apexengineering.edu',
        phone: '+91 40 2345 6789',
        emergencyPhone: '+91 98480 99887',
        website: 'https://www.apexengineering.edu'
      },
      affiliation: {
        university: 'Jawaharlal Nehru Technological University (JNTU)',
        approvalBody: 'All India Council for Technical Education (AICTE)',
        aicteApprovalNumber: 'AICTE-F-1-432891901/2024',
        ugcStatus: '2(f) & 12(B) Recognized',
        autonomousStatus: 'UGC Autonomous Status Conferred (2020-2030)'
      },
      accreditation: {
        naacGrade: 'A++',
        naacCgpa: '3.68 / 4.00',
        naacValidUntil: '2028-12-31',
        nbaStatus: 'Tier-1 Accredited (CSE, ECE, MECH, EEE)',
        nirfRankBand: 'Rank Band 101 - 150 (Engineering)'
      },
      targetStudentCapacity: 1000,
      currentAcademicYear: '2026 - 2027',
      activeSemesterTerm: 'Odd Semester (Sem 1, 3, 5, 7)',
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      })
    };

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === superAdminUser._id) return { select: jest.fn().mockResolvedValue(superAdminUser) };
      if (idStr === principalUser._id) return { select: jest.fn().mockResolvedValue(principalUser) };
      if (idStr === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });

    jest.spyOn(Institution, 'getSingleton').mockResolvedValue(mockInstitutionDoc);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/institution/profile', () => {
    it('should return institutional profile for authenticated super admin', async () => {
      const res = await request(app)
        .get('/api/v1/institution/profile')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apex Institute of Technology & Engineering');
      expect(res.body.data.code).toBe('AITE-500032');
      expect(res.body.data.affiliation.university).toBe('Jawaharlal Nehru Technological University (JNTU)');
      expect(res.body.data.accreditation.naacGrade).toBe('A++');
    });

    it('should allow student or faculty to view profile in read-only mode', async () => {
      const res = await request(app)
        .get('/api/v1/institution/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apex Institute of Technology & Engineering');
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/institution/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/institution/profile', () => {
    it('should allow Super Admin to update institution profile', async () => {
      const updateData = {
        name: 'Apex Institute of Technology',
        code: 'AITE-HYD',
        establishedYear: 2006,
        tagline: 'Leading the Future of Engineering',
        address: {
          line1: 'Plot 100, Tech Park',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          country: 'India'
        },
        contact: {
          email: 'admin@apex-tech.edu',
          phone: '+91 40 8888 9999',
          website: 'https://www.apex-tech.edu'
        },
        affiliation: {
          university: 'JNTU Hyderabad',
          approvalBody: 'AICTE',
          aicteApprovalNumber: 'AICTE-HYD-9988',
          ugcStatus: 'Autonomous',
          autonomousStatus: 'Conferred'
        },
        accreditation: {
          naacGrade: 'A+',
          naacCgpa: '3.55 / 4.00',
          naacValidUntil: '2029-06-30',
          nbaStatus: 'Tier-1 Accredited',
          nirfRankBand: 'Top 100'
        }
      };

      const res = await request(app)
        .put('/api/v1/institution/profile')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockInstitutionDoc.name).toBe('Apex Institute of Technology');
      expect(mockInstitutionDoc.code).toBe('AITE-HYD');
      expect(mockInstitutionDoc.contact.email).toBe('admin@apex-tech.edu');
      expect(mockInstitutionDoc.accreditation.naacGrade).toBe('A+');
      expect(mockInstitutionDoc.save).toHaveBeenCalled();
    });

    it('should forbid non-super_admin (Principal) from updating profile with 403', async () => {
      const res = await request(app)
        .put('/api/v1/institution/profile')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          name: 'Hacked College',
          code: 'HACK'
        });

      expect(res.status).toBe(403);
    });

    it('should forbid student role from updating profile with 403', async () => {
      const res = await request(app)
        .put('/api/v1/institution/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Student Edit',
          code: 'STU'
        });

      expect(res.status).toBe(403);
    });

    it('should reject invalid email format with 400', async () => {
      const res = await request(app)
        .put('/api/v1/institution/profile')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Apex College',
          code: 'AITE-01',
          contact: {
            email: 'not-an-email'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('email format');
    });

    it('should reject missing name with 400', async () => {
      const res = await request(app)
        .put('/api/v1/institution/profile')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: '',
          code: 'AITE-01'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('name is required');
    });
  });

  describe('POST /api/v1/institution/logo', () => {
    it('should allow Super Admin to upload or change college logo', async () => {
      const res = await request(app)
        .post('/api/v1/institution/logo')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockInstitutionDoc.logoUrl).toContain('data:image/png;base64');
      expect(mockInstitutionDoc.save).toHaveBeenCalled();
    });

    it('should forbid student from uploading logo with 403', async () => {
      const res = await request(app)
        .post('/api/v1/institution/logo')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          logoUrl: 'https://example.com/logo.png'
        });

      expect(res.status).toBe(403);
    });
  });
});

