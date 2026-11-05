const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Examination = require('../src/modules/examinations/exam.model');
const ExamRegistration = require('../src/modules/examinations/examRegistration.model');
const ExamAttendance = require('../src/modules/examinations/examAttendance.model');
const Result = require('../src/modules/results/result.model');
const Student = require('../src/modules/students/student.model');
const Attendance = require('../src/modules/attendance/attendance.model');
const AuditLog = require('../src/modules/audit-logs/audit.model');

describe('Examination Controller Operations & Intelligence Test Suite', () => {
  const adminUser = {
    _id: '507f1f77bcf86cd799439001',
    name: 'Controller Arthur Mitchell',
    email: 'coe@college.edu',
    role: ROLES.SUPER_ADMIN,
    status: 'active'
  };

  const facultyUser = {
    _id: '507f1f77bcf86cd799439002',
    name: 'Prof. Alan Turing',
    email: 'faculty@college.edu',
    role: ROLES.FACULTY,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439003',
    name: 'Aarav Sharma',
    email: 'student@college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const adminToken = jwt.sign(
    { id: adminUser._id, role: adminUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const facultyToken = jwt.sign(
    { id: facultyUser._id, role: facultyUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: studentUser._id, role: studentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const mockExamId = '507f1f77bcf86cd799439111';
  const mockSubjectId = '507f1f77bcf86cd799439222';
  const mockStudentId = '507f1f77bcf86cd799439333';
  const mockRegId = '507f1f77bcf86cd799439444';
  const mockResultId = '507f1f77bcf86cd799439555';

  const createQueryMock = (resolvedValue) => {
    const q = {
      populate: jest.fn().mockImplementation(() => q),
      sort: jest.fn().mockImplementation(() => q),
      limit: jest.fn().mockImplementation(() => q),
      select: jest.fn().mockImplementation(() => q),
      then: (resolve) => resolve(resolvedValue)
    };
    return q;
  };

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === adminUser._id) return { select: jest.fn().mockResolvedValue(adminUser) };
      if (idStr === facultyUser._id) return { select: jest.fn().mockResolvedValue(facultyUser) };
      if (idStr === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });

    jest.spyOn(AuditLog, 'create').mockResolvedValue({});
    jest.spyOn(AuditLog, 'find').mockReturnValue(createQueryMock([]));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Controller Dashboard Statistics (/api/v1/examinations/controller/stats)', () => {
    it('should retrieve 7 KPI metrics and upcoming schedule telemetry', async () => {
      jest.spyOn(Examination, 'countDocuments').mockResolvedValue(8);
      jest.spyOn(ExamRegistration, 'countDocuments').mockResolvedValue(150);
      jest.spyOn(Result, 'countDocuments').mockResolvedValue(450);

      const mockExams = [
        {
          _id: mockExamId,
          name: 'Semester End Theory 2026',
          examType: 'Semester End',
          semester: 4,
          status: 'scheduled',
          schedules: [
            {
              subject: { _id: mockSubjectId, name: 'Computer Networks', code: 'CS401' },
              date: new Date('2026-11-20'),
              startTime: '09:30 AM',
              endTime: '12:30 PM',
              venue: 'Main Examination Hall',
              roomNumber: 'Hall 101',
              invigilator: 'Prof. Turing'
            }
          ]
        }
      ];

      jest.spyOn(Examination, 'find').mockReturnValue(createQueryMock(mockExams));
      jest.spyOn(Examination, 'aggregate').mockResolvedValue([{ _id: 'Semester End', count: 8 }]);

      const res = await request(app)
        .get('/api/v1/examinations/controller/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.kpis.totalExams).toBe(8);
      expect(res.body.data.upcomingSchedules).toHaveLength(1);
      expect(res.body.data.upcomingSchedules[0].subjectCode).toBe('CS401');
    });
  });

  describe('2. Schedule Clash Detection (/api/v1/examinations/check-clash)', () => {
    it('should detect room double-booking collision when slots overlap', async () => {
      jest.spyOn(Examination, 'find').mockReturnValue(createQueryMock([]));

      const clashPayload = {
        examinationId: mockExamId,
        semester: 4,
        slots: [
          {
            subject: mockSubjectId,
            date: '2026-11-25',
            startTime: '09:30 AM',
            endTime: '12:30 PM',
            venue: 'Main Hall',
            roomNumber: '101'
          },
          {
            subject: '507f1f77bcf86cd799439888',
            date: '2026-11-25',
            startTime: '10:00 AM',
            endTime: '01:00 PM',
            venue: 'Main Hall',
            roomNumber: '101'
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/examinations/check-clash')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clashPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasClashes).toBe(true);
      expect(res.body.data.clashes.some((c) => c.type === 'room_double_booking')).toBe(true);
    });
  });

  describe('3. Schedule Slots Update (/api/v1/examinations/:id/schedules)', () => {
    it('should update and persist examination timetable slots', async () => {
      const mockExamDoc = {
        _id: mockExamId,
        name: 'Mid-Term 1',
        schedules: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockPopulated = {
        ...mockExamDoc,
        schedules: [
          {
            subject: { _id: mockSubjectId, name: 'Computer Networks', code: 'CS401' },
            date: new Date('2026-11-20'),
            startTime: '09:30 AM',
            endTime: '12:30 PM',
            venue: 'Hall A',
            roomNumber: '201',
            maxCapacity: 60,
            invigilator: 'Prof. Turing'
          }
        ]
      };

      jest.spyOn(Examination, 'findById')
        .mockResolvedValueOnce(mockExamDoc)
        .mockReturnValueOnce(createQueryMock(mockPopulated));

      const res = await request(app)
        .put(`/api/v1/examinations/${mockExamId}/schedules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schedules: [
            {
              subject: mockSubjectId,
              date: '2026-11-20',
              startTime: '09:30 AM',
              endTime: '12:30 PM',
              venue: 'Hall A',
              roomNumber: '201',
              maxCapacity: 60,
              invigilator: 'Prof. Turing'
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schedules).toHaveLength(1);
    });
  });

  describe('4. Student Examination Registration (/api/v1/examinations/registrations)', () => {
    it('should register a candidate and compute attendance-based eligibility', async () => {
      jest.spyOn(Examination, 'findById').mockResolvedValue({
        _id: mockExamId,
        name: 'Semester End',
        attendanceCutoffPercentage: 75,
        academicYear: '2026-2027'
      });

      jest.spyOn(ExamRegistration, 'findOne').mockResolvedValue(null);

      // Mock attendance: 80 out of 100 present sessions = 80% (eligible)
      jest.spyOn(Attendance, 'countDocuments')
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80); // present

      const mockSavedReg = {
        _id: mockRegId,
        registrationNumber: 'REG-2026-12345',
        examination: mockExamId,
        student: mockStudentId,
        attendancePercentage: 80,
        eligibilityStatus: 'eligible',
        feeCleared: true
      };

      jest.spyOn(ExamRegistration, 'create').mockResolvedValue(mockSavedReg);
      jest.spyOn(ExamRegistration, 'findById').mockReturnValue(createQueryMock(mockSavedReg));

      const res = await request(app)
        .post('/api/v1/examinations/registrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examination: mockExamId,
          student: mockStudentId,
          examFeePaid: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eligibilityStatus).toBe('eligible');
      expect(res.body.data.attendancePercentage).toBe(80);
    });
  });

  describe('5. Condonation Waiver (/api/v1/examinations/registrations/:id/condone)', () => {
    it('should sanction attendance shortage condonation with remarks', async () => {
      const mockRegDoc = {
        _id: mockRegId,
        registrationNumber: 'REG-2026-12345',
        attendancePercentage: 68,
        eligibilityStatus: 'shortage',
        condonationRemarks: '',
        student: {
          rollNumber: 'CS2026001',
          user: { name: 'Aarav Sharma' }
        },
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(ExamRegistration, 'findById').mockReturnValue(createQueryMock(mockRegDoc));

      const res = await request(app)
        .put(`/api/v1/examinations/registrations/${mockRegId}/condone`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          remarks: 'Approved medical certificate verified'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eligibilityStatus).toBe('condoned');
    });
  });

  describe('6. Hall Ticket Batch Generation (/api/v1/examinations/:id/generate-hall-tickets)', () => {
    it('should assign seat numbers to eligible candidates', async () => {
      jest.spyOn(Examination, 'findById').mockReturnValue(
        createQueryMock({
          _id: mockExamId,
          name: 'Semester End Theory',
          semester: 4,
          academicYear: '2026-2027',
          department: { code: 'CSE' }
        })
      );

      const mockEligibleRegs = [
        {
          _id: mockRegId,
          student: mockStudentId,
          eligibilityStatus: 'eligible',
          feeCleared: true,
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      jest.spyOn(ExamRegistration, 'find').mockResolvedValue(mockEligibleRegs);

      const res = await request(app)
        .post(`/api/v1/examinations/${mockExamId}/generate-hall-tickets`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ seatPrefix: 'SEAT' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.generatedCount).toBe(1);
    });
  });

  describe('7. Exam Hall Attendance Roster (/api/v1/examinations/attendance/batch)', () => {
    it('should record batch attendance for examination session', async () => {
      jest.spyOn(ExamAttendance, 'bulkWrite').mockResolvedValue({
        upsertedCount: 1,
        modifiedCount: 0
      });

      const res = await request(app)
        .post('/api/v1/examinations/attendance/batch')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          examination: mockExamId,
          subject: mockSubjectId,
          records: [
            {
              studentId: mockStudentId,
              status: 'present',
              remarks: 'Normal'
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.savedRecordsCount).toBe(1);
    });
  });

  describe('8. Marks Verification Desk (/api/v1/results/:id/verify)', () => {
    it('should sign off on verified result entry', async () => {
      const mockResult = {
        _id: mockResultId,
        internalMarks: 35,
        externalMarks: 50,
        totalMarks: 85,
        grade: 'A+',
        verificationStatus: 'verified'
      };

      jest.spyOn(Result, 'findByIdAndUpdate').mockReturnValue(createQueryMock(mockResult));

      const res = await request(app)
        .put(`/api/v1/results/${mockResultId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ verificationStatus: 'verified' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('verified');
    });
  });

  describe('9. Results Processing & Publication (/api/v1/results/process & /publish)', () => {
    it('should process examination results and calculate statistics', async () => {
      jest.spyOn(Examination, 'findById').mockResolvedValue({
        _id: mockExamId,
        name: 'Semester End 2026'
      });

      const mockResults = [
        {
          _id: mockResultId,
          student: mockStudentId,
          subject: { _id: mockSubjectId, credits: 4 },
          internalMarks: 32,
          externalMarks: 48,
          totalMarks: 80,
          grade: 'A+',
          status: 'passed',
          verificationStatus: 'verified'
        }
      ];

      jest.spyOn(Result, 'find').mockReturnValue(createQueryMock(mockResults));
      jest.spyOn(Result, 'bulkWrite').mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .post(`/api/v1/results/process/${mockExamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEntries).toBe(1);
      expect(res.body.data.passPercentage).toBe(100);
      expect(res.body.data.isReadyForPublication).toBe(true);
    });

    it('should publish results to the student portal', async () => {
      const mockExamDoc = {
        _id: mockExamId,
        name: 'Semester End 2026',
        isPublished: false,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Examination, 'findById').mockResolvedValue(mockExamDoc);
      jest.spyOn(Result, 'countDocuments').mockResolvedValue(0); // 0 flagged
      jest.spyOn(Result, 'updateMany').mockResolvedValue({ modifiedCount: 25 });

      const res = await request(app)
        .post(`/api/v1/results/publish/${mockExamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.publishedCount).toBe(25);
    });
  });

  describe('10. Examination Analytics & Reports (/api/v1/examinations/reports/summary)', () => {
    it('should aggregate pass rates, grade distribution, and distinction rankers', async () => {
      jest.spyOn(Result, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Result, 'aggregate')
        .mockResolvedValueOnce([{ _id: 'A+', count: 1 }]) // grade distribution
        .mockResolvedValueOnce([
          {
            _id: mockSubjectId,
            code: 'CS401',
            name: 'Computer Networks',
            appeared: 1,
            passed: 1,
            passRate: 100,
            avgInternal: 35,
            avgExternal: 50,
            avgTotal: 85
          }
        ]); // subject agg

      const mockStudents = [
        {
          _id: mockResultId,
          student: {
            rollNumber: 'CS2026001',
            user: { name: 'Aarav Sharma' }
          },
          subject: {
            name: 'Computer Networks',
            code: 'CS401'
          },
          totalMarks: 85,
          grade: 'A+',
          status: 'passed'
        }
      ];

      jest.spyOn(Result, 'find').mockReturnValue(createQueryMock(mockStudents));

      const res = await request(app)
        .get('/api/v1/examinations/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalEvaluated).toBe(1);
      expect(res.body.data.summary.overallPassRate).toBe(100);
      expect(res.body.data.gradeDistribution['A+']).toBe(1);
      expect(res.body.data.topRankers).toHaveLength(1);
      expect(res.body.data.topRankers[0].rollNumber).toBe('CS2026001');
    });
  });

  describe('11. Security & Role Invariants', () => {
    it('should deny unauthenticated requests to examination controller endpoints', async () => {
      const res = await request(app).get('/api/v1/examinations/controller/stats');
      expect(res.status).toBe(401);
    });

    it('should deny student role from publishing examination results', async () => {
      const res = await request(app)
        .post(`/api/v1/results/publish/${mockExamId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
