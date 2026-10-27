const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const Department = require('../src/modules/departments/department.model');
const Course = require('../src/modules/courses/course.model');
const Timetable = require('../src/modules/timetable/timetable.model');
const Attendance = require('../src/modules/attendance/attendance.model');
const Examination = require('../src/modules/examinations/exam.model');
const Result = require('../src/modules/results/result.model');
const Student = require('../src/modules/students/student.model');

describe('Academic Modules (Phase 2) Test Suite', () => {
  const adminToken = jwt.sign(
    { id: '507f1f77bcf86cd799439001', role: ROLES.SUPER_ADMIN },
    env.JWT_SECRET
  );
  const facultyToken = jwt.sign(
    { id: '507f1f77bcf86cd799439002', role: ROLES.FACULTY },
    env.JWT_SECRET
  );
  const studentToken = jwt.sign(
    { id: '507f1f77bcf86cd799439003', role: ROLES.STUDENT },
    env.JWT_SECRET
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // A. Departments Tests
  describe('A. Departments Module', () => {
    it('GET /api/v1/departments lists all departments', async () => {
      jest.spyOn(Department, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { _id: '507f1f77bcf86cd799439011', name: 'Computer Science', code: 'CSE', intakeCapacity: 120 }
        ])
      });

      const res = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].code).toBe('CSE');
    });

    it('POST /api/v1/departments rejects duplicate department code', async () => {
      jest.spyOn(Department, 'findOne').mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        code: 'CSE',
        name: 'Computer Science & Engineering'
      });

      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Computer Science',
          code: 'CSE',
          intakeCapacity: 120
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  // B. Courses Tests
  describe('B. Programs & Courses Module', () => {
    it('POST /api/v1/courses rejects duplicate course code', async () => {
      jest.spyOn(Course, 'findOne').mockResolvedValue({
        _id: '507f1f77bcf86cd799439022',
        code: 'BTECH-CSE'
      });

      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'B.Tech CSE',
          code: 'BTECH-CSE',
          department: '507f1f77bcf86cd799439011'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  // C. Timetable Conflict Tests
  describe('C. Timetable Conflict Module', () => {
    it('POST /api/v1/timetable rejects scheduling on faculty conflict with 409 Conflict', async () => {
      // Mock existing faculty clash
      jest.spyOn(Timetable, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439033',
          dayOfWeek: 'Monday',
          periodNumber: 1,
          subject: { code: 'CS301', name: 'DSA' }
        })
      });

      const res = await request(app)
        .post('/api/v1/timetable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          department: '507f1f77bcf86cd799439011',
          course: '507f1f77bcf86cd799439022',
          semester: 3,
          section: 'A',
          dayOfWeek: 'Monday',
          periodNumber: 1,
          startTime: '09:00',
          endTime: '09:50',
          subject: '507f1f77bcf86cd799439031',
          faculty: '507f1f77bcf86cd799439002',
          roomNumber: 'LH-101'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Faculty conflict');
    });
  });

  // D. Attendance Tests
  describe('D. Daily Attendance Module', () => {
    it('POST /api/v1/attendance/batch records student roster attendance with bulkWrite', async () => {
      jest.spyOn(Attendance, 'bulkWrite').mockResolvedValue({
        matchedCount: 2,
        modifiedCount: 2,
        upsertedCount: 0
      });

      const res = await request(app)
        .post('/api/v1/attendance/batch')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          subject: '507f1f77bcf86cd799439031',
          date: '2026-10-27',
          periodNumber: 1,
          records: [
            { studentId: '507f1f77bcf86cd799439041', status: 'present' },
            { studentId: '507f1f77bcf86cd799439042', status: 'absent' }
          ]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Attendance recorded successfully');
    });
  });

  // E. Examinations Tests
  describe('E. Examinations Module', () => {
    it('POST /api/v1/examinations rejects start date later than end date with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/examinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Date Exam',
          academicYear: '2025-2026',
          semester: 3,
          startDate: '2026-12-10',
          endDate: '2026-12-01' // earlier than start!
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('start date cannot be later than end date');
    });
  });

  // F. Results & Grades Tests
  describe('F. Results & Grades Module', () => {
    it('POST /api/v1/results rejects internal marks exceeding 40 with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/results')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          examination: '507f1f77bcf86cd799439051',
          student: '507f1f77bcf86cd799439041',
          subject: '507f1f77bcf86cd799439031',
          internalMarks: 45, // Exceeds 40!
          externalMarks: 50
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Internal marks must be between 0 and 40');
    });

    it('POST /api/v1/results rejects negative external marks with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/results')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          examination: '507f1f77bcf86cd799439051',
          student: '507f1f77bcf86cd799439041',
          subject: '507f1f77bcf86cd799439031',
          internalMarks: 30,
          externalMarks: -5 // Negative!
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('External marks must be between 0 and 60');
    });

    it('GET /api/v1/results filters out unpublished examinations for Student role', async () => {
      // Mock student profile
      jest.spyOn(Student, 'findOne').mockResolvedValue({
        _id: '507f1f77bcf86cd799439041',
        user: '507f1f77bcf86cd799439003'
      });

      // Mock finding published exams (only exam #1 is published)
      jest.spyOn(Examination, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439051' }])
      });

      const findSpy = jest.spyOn(Result, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([
                {
                  _id: '507f1f77bcf86cd799439061',
                  internalMarks: 35,
                  externalMarks: 52,
                  totalMarks: 87,
                  grade: 'A+',
                  status: 'passed'
                }
              ])
            })
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/results')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify the query passed to Result.find strictly contained the published exam IDs
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          student: '507f1f77bcf86cd799439041',
          examination: { $in: ['507f1f77bcf86cd799439051'] }
        })
      );
    });
  });
});

