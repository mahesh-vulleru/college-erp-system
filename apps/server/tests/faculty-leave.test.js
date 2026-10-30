const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Faculty = require('../src/modules/faculty/faculty.model');
const Department = require('../src/modules/departments/department.model');
const Leave = require('../src/modules/leave/leave.model');

describe('Faculty Leave Management Test Suite (Feature 2)', () => {
  const principalUser = {
    _id: '507f1f77bcf86cd799439001',
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    role: ROLES.PRINCIPAL,
    status: 'active'
  };

  const facultyUser = {
    _id: '507f1f77bcf86cd799439002',
    name: 'Prof. Alan Turing',
    email: 'turing@college.edu',
    role: ROLES.FACULTY,
    status: 'active'
  };

  const principalToken = jwt.sign(
    { id: principalUser._id, role: principalUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const facultyToken = jwt.sign(
    { id: facultyUser._id, role: facultyUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const mockDepartment = {
    _id: '507f1f77bcf86cd799439010',
    name: 'Computer Science & Engineering',
    code: 'CSE'
  };

  const mockFaculty = {
    _id: '507f1f77bcf86cd799439020',
    employeeId: 'FAC-CSE-001',
    user: facultyUser._id,
    department: mockDepartment._id,
    designation: 'Professor'
  };

  const mockLeave = {
    _id: '507f1f77bcf86cd799439030',
    faculty: mockFaculty,
    user: facultyUser,
    department: mockDepartment,
    leaveType: 'casual',
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-11-03'),
    reason: 'Attending IEEE international research symposium',
    status: 'pending',
    createdAt: new Date()
  };

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === principalUser._id) return { select: jest.fn().mockResolvedValue(principalUser) };
      if (idStr === facultyUser._id) return { select: jest.fn().mockResolvedValue(facultyUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });
    jest.spyOn(Leave, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === mockLeave._id) {
        return {
          populate: jest.fn().mockReturnThis(),
          then: jest.fn((cb) => cb(mockLeave))
        };
      }
      return {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(null))
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/leaves', () => {
    it('should list leave requests and summary metrics for Principal', async () => {
      jest.spyOn(Leave, 'countDocuments').mockImplementation((filter) => {
        if (filter?.status === 'pending') return Promise.resolve(1);
        if (filter?.status === 'approved') return Promise.resolve(2);
        if (filter?.status === 'rejected') return Promise.resolve(1);
        return Promise.resolve(4);
      });

      jest.spyOn(Leave, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockLeave])
      });

      const res = await request(app)
        .get('/api/v1/leaves')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.pendingCount).toBe(1);
      expect(res.body.data.summary.approvedCount).toBe(2);
      expect(res.body.data.leaves.length).toBe(1);
      expect(res.body.data.leaves[0].durationDays).toBe(3);
    });
  });

  describe('POST /api/v1/leaves', () => {
    it('should validate leave application: reject if reason is missing', async () => {
      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          leaveType: 'casual',
          startDate: '2026-11-01',
          endDate: '2026-11-03'
          // reason missing
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toContain('Reason for leave is required');
    });

    it('should reject if startDate is after endDate', async () => {
      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          leaveType: 'casual',
          startDate: '2026-11-05',
          endDate: '2026-11-01',
          reason: 'Personal leave'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toContain('Start date cannot be after end date');
    });

    it('should allow faculty to submit valid leave application', async () => {
      jest.spyOn(Faculty, 'findOne').mockResolvedValue(mockFaculty);
      jest.spyOn(Leave, 'create').mockResolvedValue({
        ...mockLeave,
        _id: '507f1f77bcf86cd799439031'
      });

      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          leaveType: 'casual',
          startDate: '2026-11-01',
          endDate: '2026-11-03',
          reason: 'Attending research symposium'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
    });
  });

  describe('PATCH /api/v1/leaves/:id/review', () => {
    it('should forbid faculty from reviewing leave applications', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/${mockLeave._id}/review`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
    });

    it('should allow Principal to approve a pending leave request', async () => {
      const approvedLeave = {
        ...mockLeave,
        status: 'approved',
        reviewedBy: principalUser,
        reviewedAt: new Date()
      };

      jest.spyOn(Leave, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(approvedLeave))
      });

      const res = await request(app)
        .patch(`/api/v1/leaves/${mockLeave._id}/review`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({ status: 'approved', remarks: 'Sanctioned' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
    });

    it('should fail with 400 when rejecting without a mandatory rejectionReason', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/${mockLeave._id}/review`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          status: 'rejected'
          // rejectionReason missing
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toContain('Rejection reason is mandatory when rejecting a leave request');
    });

    it('should succeed when rejecting with a valid rejectionReason', async () => {
      const rejectedLeave = {
        ...mockLeave,
        status: 'rejected',
        rejectionReason: 'Substitutes not arranged for exam duty',
        reviewedBy: principalUser,
        reviewedAt: new Date()
      };

      jest.spyOn(Leave, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(rejectedLeave))
      });

      const res = await request(app)
        .patch(`/api/v1/leaves/${mockLeave._id}/review`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          status: 'rejected',
          rejectionReason: 'Substitutes not arranged for exam duty'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.rejectionReason).toBe('Substitutes not arranged for exam duty');
    });

    it('should enforce concurrency safety: return 409 if leave is not pending', async () => {
      // findOneAndUpdate with status: 'pending' returns null because it was already decided
      jest.spyOn(Leave, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(null))
      });

      // existing record check reveals it's already 'approved'
      jest.spyOn(Leave, 'findById').mockResolvedValue({
        ...mockLeave,
        status: 'approved'
      });

      const res = await request(app)
        .patch(`/api/v1/leaves/${mockLeave._id}/review`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          status: 'approved'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('LEAVE_ALREADY_REVIEWED');
    });
  });
});

