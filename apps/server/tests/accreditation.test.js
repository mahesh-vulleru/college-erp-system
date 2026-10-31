const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Accreditation = require('../src/modules/accreditation/accreditation.model');

describe('Accreditation & Compliance Management Test Suite', () => {
  const principalUser = {
    _id: '507f1f77bcf86cd799439001',
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    role: ROLES.PRINCIPAL,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439003',
    name: 'Alice Cooper',
    email: 'alice@student.college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

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

  const mockCriterion = {
    _id: '507f1f77bcf86cd799439050',
    code: 'NAAC-1.1.1',
    title: 'Curricular Planning and Implementation',
    description: 'Systematic implementation of curriculum across departments',
    framework: 'NAAC',
    category: 'Curricular Aspects',
    weightage: 100,
    compliancePercentage: 80,
    status: 'in_progress',
    dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    assignedOwner: {
      _id: principalUser._id,
      name: principalUser.name,
      email: principalUser.email
    },
    department: null,
    evidenceDocuments: [
      {
        _id: '507f1f77bcf86cd799439060',
        name: 'Curriculum Council Minutes.pdf',
        url: '/uploads/curriculum.pdf',
        verificationStatus: 'pending'
      }
    ],
    save: jest.fn().mockResolvedValue(true)
  };

  const createQueryMock = (result) => {
    const p = Promise.resolve(result);
    p.populate = jest.fn().mockImplementation(() => p);
    p.sort = jest.fn().mockImplementation(() => p);
    p.lean = jest.fn().mockResolvedValue(result);
    return p;
  };

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === principalUser._id) return { select: jest.fn().mockResolvedValue(principalUser) };
      if (idStr === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/accreditation/summary', () => {
    it('should compute overall compliance summary metrics', async () => {
      jest.spyOn(Accreditation, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: mockCriterion._id,
            category: 'Curricular Aspects',
            weightage: 100,
            compliancePercentage: 80,
            status: 'in_progress',
            dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
            evidenceDocuments: [{ verificationStatus: 'pending' }]
          },
          {
            _id: '507f1f77bcf86cd799439051',
            category: 'Teaching-Learning & Evaluation',
            weightage: 100,
            compliancePercentage: 100,
            status: 'completed',
            dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
            evidenceDocuments: [{ verificationStatus: 'verified' }]
          }
        ])
      });

      const res = await request(app)
        .get('/api/v1/accreditation/summary')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCriteria).toBe(2);
      expect(res.body.data.completedCriteria).toBe(1);
      expect(res.body.data.pendingVerification).toBe(1);
      expect(res.body.data.overallCompliancePercentage).toBe(90);
    });
  });

  describe('GET /api/v1/accreditation', () => {
    it('should return paginated criteria and summary breakdown', async () => {
      jest.spyOn(Accreditation, 'find').mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([mockCriterion])
        };
      });

      const res = await request(app)
        .get('/api/v1/accreditation?framework=NAAC')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.criteria.length).toBe(1);
      expect(res.body.data.criteria[0].code).toBe('NAAC-1.1.1');
    });

    it('should forbid students from accessing accreditation criteria', async () => {
      const res = await request(app)
        .get('/api/v1/accreditation')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/accreditation', () => {
    it('should validate required fields when creating criterion', async () => {
      const res = await request(app)
        .post('/api/v1/accreditation')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          title: 'New criterion without code'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should create a criterion successfully with valid inputs', async () => {
      jest.spyOn(Accreditation, 'findOne').mockResolvedValue(null);
      jest.spyOn(Accreditation, 'create').mockResolvedValue({
        ...mockCriterion,
        code: 'NAAC-2.1.1',
        title: 'Student Enrollment and Profile'
      });

      const res = await request(app)
        .post('/api/v1/accreditation')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          code: 'NAAC-2.1.1',
          title: 'Student Enrollment and Profile',
          description: 'Verification of state reservation and seat matrix',
          framework: 'NAAC',
          category: 'Teaching-Learning & Evaluation',
          assignedOwner: principalUser._id,
          weightage: 50,
          dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('NAAC-2.1.1');
    });
  });

  describe('POST /api/v1/accreditation/:id/evidence & PATCH verify', () => {
    it('should attach evidence document to criterion', async () => {
      const criterionInstance = {
        ...mockCriterion,
        evidenceDocuments: [],
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      jest.spyOn(Accreditation, 'findById').mockImplementation(() => createQueryMock(criterionInstance));

      const res = await request(app)
        .post(`/api/v1/accreditation/${mockCriterion._id}/evidence`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          name: 'Academic Council Resolution 2026.pdf',
          url: 'https://storage.college.edu/docs/resolution.pdf',
          fileType: 'application/pdf',
          fileSize: 1048576
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(criterionInstance.save).toHaveBeenCalled();
    });
  });
});

