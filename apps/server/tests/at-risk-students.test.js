const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Student = require('../src/modules/students/student.model');
const Attendance = require('../src/modules/attendance/attendance.model');
const Result = require('../src/modules/results/result.model');
const Department = require('../src/modules/departments/department.model');

describe('Student At-Risk Identification Test Suite (Feature 1)', () => {
  const principalUser = {
    _id: '507f1f77bcf86cd799439001',
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    role: ROLES.PRINCIPAL,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439003',
    name: 'Aarav Sharma',
    email: 'aarav@college.edu',
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

  const mockDepartment = {
    _id: '507f1f77bcf86cd799439010',
    name: 'Computer Science & Engineering',
    code: 'CSE'
  };

  const mockStudents = [
    {
      _id: '507f1f77bcf86cd799439021',
      rollNumber: 'CSE-2024-001',
      user: { _id: '507f1f77bcf86cd799439031', name: 'Rohan Sharma', email: 'rohan@college.edu' },
      department: mockDepartment,
      currentSemester: 3,
      batchYear: '2024-2028',
      admissionStatus: 'enrolled'
    },
    {
      _id: '507f1f77bcf86cd799439022',
      rollNumber: 'CSE-2024-002',
      user: { _id: '507f1f77bcf86cd799439032', name: 'Neha Gupta', email: 'neha@college.edu' },
      department: mockDepartment,
      currentSemester: 3,
      batchYear: '2024-2028',
      admissionStatus: 'enrolled'
    },
    {
      _id: '507f1f77bcf86cd799439023',
      rollNumber: 'CSE-2024-003',
      user: { _id: '507f1f77bcf86cd799439033', name: 'Vikram Singh', email: 'vikram@college.edu' },
      department: mockDepartment,
      currentSemester: 3,
      batchYear: '2024-2028',
      admissionStatus: 'enrolled'
    }
  ];

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

  describe('GET /api/v1/students/at-risk', () => {
    it('should reject unauthorized requests without token', async () => {
      const res = await request(app).get('/api/v1/students/at-risk');
      expect(res.status).toBe(401);
    });

    it('should forbid student role from viewing at-risk institutional analytics', async () => {
      const res = await request(app)
        .get('/api/v1/students/at-risk')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('should compute attendance percentages and classify risk accurately for Principal', async () => {
      // Rohan: 5 present / 10 classes = 50% (<65% -> critical)
      // Neha: 7 present / 10 classes = 70% (65-74% -> warning)
      // Vikram: 9 present / 10 classes = 90% (>=75% -> safe)
      const mockAttendance = [
        ...Array(5).fill({ student: mockStudents[0]._id, status: 'present', date: new Date() }),
        ...Array(5).fill({ student: mockStudents[0]._id, status: 'absent', date: new Date() }),
        ...Array(7).fill({ student: mockStudents[1]._id, status: 'present', date: new Date() }),
        ...Array(3).fill({ student: mockStudents[1]._id, status: 'absent', date: new Date() }),
        ...Array(9).fill({ student: mockStudents[2]._id, status: 'present', date: new Date() }),
        ...Array(1).fill({ student: mockStudents[2]._id, status: 'absent', date: new Date() })
      ];

      jest.spyOn(Student, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStudents)
      });

      jest.spyOn(Attendance, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAttendance)
      });

      jest.spyOn(Result, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      const res = await request(app)
        .get('/api/v1/students/at-risk')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { summary, students } = res.body.data;
      expect(summary.totalEvaluated).toBe(3);
      expect(summary.criticalCount).toBe(1); // Rohan (<65%)
      expect(summary.warningCount).toBe(1);  // Neha (65-74%)
      expect(summary.safeCount).toBe(1);     // Vikram (>=75%)
      expect(summary.below75Count).toBe(2);  // Rohan + Neha (<75%)

      const rohan = students.find((s) => s.rollNumber === 'CSE-2024-001');
      expect(rohan.riskLevel).toBe('critical');
      expect(rohan.attendance.percentage).toBe(50);

      const neha = students.find((s) => s.rollNumber === 'CSE-2024-002');
      expect(neha.riskLevel).toBe('warning');
      expect(neha.attendance.percentage).toBe(70);

      const vikram = students.find((s) => s.rollNumber === 'CSE-2024-003');
      expect(vikram.riskLevel).toBe('safe');
      expect(vikram.attendance.percentage).toBe(90);
    });

    it('should classify student with multiple course failures as critical even if attendance is safe', async () => {
      // Vikram has 90% attendance but 2 failed subjects
      const mockAttendance = [
        ...Array(9).fill({ student: mockStudents[2]._id, status: 'present', date: new Date() }),
        ...Array(1).fill({ student: mockStudents[2]._id, status: 'absent', date: new Date() })
      ];

      const mockResults = [
        { student: mockStudents[2]._id, status: 'failed', grade: 'F', totalMarks: 25 },
        { student: mockStudents[2]._id, status: 'failed', grade: 'F', totalMarks: 32 }
      ];

      jest.spyOn(Student, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockStudents[2]])
      });

      jest.spyOn(Attendance, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAttendance)
      });

      jest.spyOn(Result, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockResults)
      });

      const res = await request(app)
        .get('/api/v1/students/at-risk')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      const student = res.body.data.students[0];
      expect(student.riskLevel).toBe('critical');
      expect(student.riskReasons.some((r) => r.includes('Multiple course failures'))).toBe(true);
    });

    it('should handle unassessed students when no records exist without crashing or assuming 0%', async () => {
      jest.spyOn(Student, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockStudents[0]])
      });

      jest.spyOn(Attendance, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      jest.spyOn(Result, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      const res = await request(app)
        .get('/api/v1/students/at-risk')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      const student = res.body.data.students[0];
      expect(student.riskLevel).toBe('unassessed');
      expect(student.attendance.percentage).toBeNull();
      expect(student.attendance.hasRecords).toBe(false);
    });
  });

  describe('GET /api/v1/students/:id/risk-details', () => {
    it('should return 404 if student does not exist', async () => {
      jest.spyOn(Student, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .get('/api/v1/students/507f1f77bcf86cd799439999/risk-details')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(404);
    });

    it('should return complete subject breakdown, exam results, and recent logs', async () => {
      jest.spyOn(Student, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStudents[0])
      });

      const mockAttendance = [
        {
          _id: '507f1f77bcf86cd799439051',
          date: new Date(),
          periodNumber: 1,
          status: 'present',
          subject: { _id: '507f1f77bcf86cd799439061', name: 'Data Structures', code: 'CS301' },
          faculty: { name: 'Prof. Alan' }
        },
        {
          _id: '507f1f77bcf86cd799439052',
          date: new Date(),
          periodNumber: 2,
          status: 'absent',
          subject: { _id: '507f1f77bcf86cd799439061', name: 'Data Structures', code: 'CS301' },
          faculty: { name: 'Prof. Alan' }
        }
      ];

      const mockResults = [
        {
          _id: '507f1f77bcf86cd799439071',
          examination: { name: 'Mid-Term 1', examType: 'mid_term', semester: 3 },
          subject: { name: 'Data Structures', code: 'CS301', credits: 4 },
          internalMarks: 18,
          externalMarks: 32,
          totalMarks: 50,
          grade: 'B',
          status: 'passed'
        }
      ];

      jest.spyOn(Attendance, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAttendance)
      });

      jest.spyOn(Result, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockResults)
      });

      const res = await request(app)
        .get(`/api/v1/students/${mockStudents[0]._id}/risk-details`)
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.student.rollNumber).toBe('CSE-2024-001');
      expect(data.attendanceSummary.totalClasses).toBe(2);
      expect(data.attendanceSummary.percentage).toBe(50);
      expect(data.subjectBreakdown.length).toBe(1);
      expect(data.subjectBreakdown[0].subjectName).toBe('Data Structures');
      expect(data.subjectBreakdown[0].percentage).toBe(50);
      expect(data.examResults.length).toBe(1);
      expect(data.recentAttendance.length).toBe(2);
    });
  });
});

