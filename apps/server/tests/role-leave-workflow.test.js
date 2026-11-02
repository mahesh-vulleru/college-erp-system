const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Faculty = require('../src/modules/faculty/faculty.model');
const Student = require('../src/modules/students/student.model');
const Department = require('../src/modules/departments/department.model');
const Leave = require('../src/modules/leave/leave.model');

describe('Role-Based Leave Management Workflow Tests', () => {
  const studentUser = {
    _id: '507f1f77bcf86cd799439101',
    name: 'Aarav Sharma',
    email: 'aarav@college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const teacherUser = {
    _id: '507f1f77bcf86cd799439102',
    name: 'Prof. Alan Turing',
    email: 'turing@college.edu',
    role: ROLES.FACULTY,
    status: 'active'
  };

  const hodUser = {
    _id: '507f1f77bcf86cd799439103',
    name: 'Dr. Grace Hopper',
    email: 'hod.cse@college.edu',
    role: ROLES.HOD,
    status: 'active'
  };

  const principalUser = {
    _id: '507f1f77bcf86cd799439104',
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    role: ROLES.PRINCIPAL,
    status: 'active'
  };

  const studentToken = jwt.sign({ id: studentUser._id, role: studentUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const teacherToken = jwt.sign({ id: teacherUser._id, role: teacherUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const hodToken = jwt.sign({ id: hodUser._id, role: hodUser.role }, env.JWT_SECRET, { expiresIn: '1h' });
  const principalToken = jwt.sign({ id: principalUser._id, role: principalUser.role }, env.JWT_SECRET, { expiresIn: '1h' });

  const mockDept = {
    _id: '507f1f77bcf86cd799439110',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    hod: hodUser._id
  };

  const mockStudent = {
    _id: '507f1f77bcf86cd799439120',
    rollNumber: 'CSE-2023-042',
    user: studentUser._id,
    department: mockDept,
    currentSemester: 6
  };

  const mockFaculty = {
    _id: '507f1f77bcf86cd799439130',
    employeeId: 'FAC-CSE-001',
    user: teacherUser._id,
    department: mockDept._id,
    designation: 'Associate Professor'
  };

  const mockStudentLeave = {
    _id: '507f1f77bcf86cd799439140',
    applicationId: 'LV-2026-901',
    user: studentUser._id,
    applicantRole: ROLES.STUDENT,
    applicantName: studentUser.name,
    applicantIdNumber: 'CSE-2023-042',
    department: mockDept._id,
    leaveType: 'medical',
    startDate: new Date('2026-11-10'),
    endDate: new Date('2026-11-12'),
    numberOfDays: 3,
    reason: 'Medical treatment and doctor-advised rest',
    status: 'pending',
    currentApproverRole: ROLES.FACULTY,
    currentApprover: teacherUser._id,
    approvalStage: 1,
    maxApprovalStages: 1,
    approvalHistory: [
      {
        stage: 1,
        approverRole: 'faculty',
        action: 'submitted',
        remarks: 'Application submitted',
        timestamp: new Date()
      }
    ]
  };

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      if (idStr === teacherUser._id) return { select: jest.fn().mockResolvedValue(teacherUser) };
      if (idStr === hodUser._id) return { select: jest.fn().mockResolvedValue(hodUser) };
      if (idStr === principalUser._id) return { select: jest.fn().mockResolvedValue(principalUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Student Leave Submission & Approval Workflow', () => {
    it('should allow student to submit leave application with auto-populated details', async () => {
      jest.spyOn(Student, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudent)
      });
      jest.spyOn(Leave, 'create').mockResolvedValue({
        ...mockStudentLeave,
        _id: '507f1f77bcf86cd799439141'
      });

      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          leaveType: 'medical',
          startDate: '2026-11-10',
          endDate: '2026-11-12',
          reason: 'Medical treatment and rest'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.durationDays).toBe(3);
    });

    it('should allow assigned faculty to approve student leave request with remarks', async () => {
      jest.spyOn(Leave, 'findById').mockResolvedValue(mockStudentLeave);
      const approvedStudentLeave = {
        ...mockStudentLeave,
        status: 'approved',
        reviewedBy: teacherUser,
        reviewedAt: new Date(),
        approvalHistory: [
          ...mockStudentLeave.approvalHistory,
          {
            stage: 1,
            approverRole: 'faculty',
            action: 'approved',
            remarks: 'Verified medical certificate. Sanctioned.',
            timestamp: new Date()
          }
        ]
      };

      jest.spyOn(Leave, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(approvedStudentLeave))
      });

      const res = await request(app)
        .patch(`/api/v1/leaves/${mockStudentLeave._id}/review`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          status: 'approved',
          remarks: 'Verified medical certificate. Sanctioned.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
    });

    it('should prevent applicant from approving their own leave request', async () => {
      const ownLeave = {
        ...mockStudentLeave,
        user: teacherUser._id,
        applicantRole: ROLES.STUDENT
      };
      jest.spyOn(Leave, 'findById').mockResolvedValue(ownLeave);

      const res = await request(app)
        .patch(`/api/v1/leaves/${mockStudentLeave._id}/review`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('CANNOT_APPROVE_OWN_LEAVE');
    });

    it('should require rejectionReason when rejecting a leave request', async () => {
      jest.spyOn(Leave, 'findById').mockResolvedValue(mockStudentLeave);

      const res = await request(app)
        .patch(`/api/v1/leaves/${mockStudentLeave._id}/review`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'rejected' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should allow authorized escalation to next higher authority', async () => {
      const pendingLeave = {
        ...mockStudentLeave,
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Leave, 'findById').mockResolvedValue(pendingLeave);

      const res = await request(app)
        .post(`/api/v1/leaves/${mockStudentLeave._id}/escalate`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({ remarks: 'Escalated due to urgent medical surgery' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(pendingLeave.currentApproverRole).toBe(ROLES.HOD);
      expect(pendingLeave.approvalHistory.length).toBe(2);
      expect(pendingLeave.approvalHistory[1].action).toBe('escalated');
    });

    it('should retrieve configurable approval workflow configuration', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/config')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[ROLES.STUDENT]).toBeDefined();
      expect(res.body.data[ROLES.FACULTY]).toBeDefined();
    });
  });
});
