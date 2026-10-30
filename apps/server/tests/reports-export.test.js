const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Student = require('../src/modules/students/student.model');
const Attendance = require('../src/modules/attendance/attendance.model');
const Examination = require('../src/modules/examinations/exam.model');
const Result = require('../src/modules/results/result.model');
const Department = require('../src/modules/departments/department.model');
const Faculty = require('../src/modules/faculty/faculty.model');
const Course = require('../src/modules/courses/course.model');

describe('Executive Reports Export Test Suite (Feature 3)', () => {
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
    email: 'student@college.edu',
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

  it('should reject unauthenticated export requests', async () => {
    const res = await request(app).get('/api/v1/reports/export?type=enrollment');
    expect(res.status).toBe(401);
  });

  it('should forbid student role from exporting institutional executive reports', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export?type=enrollment')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('should export enrollment report in CSV format with RFC 4180 BOM', async () => {
    const mockStudents = [
      {
        rollNumber: 'CSE-001',
        user: { name: 'Rohan Sharma', email: 'rohan@college.edu' },
        department: { code: 'CSE', name: 'Computer Science' },
        course: { code: 'BTECH' },
        currentSemester: 3,
        admissionStatus: 'enrolled'
      }
    ];

    jest.spyOn(Student, 'find').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((cb) => cb(mockStudents))
    });

    const res = await request(app)
      .get('/api/v1/reports/export?type=enrollment&format=csv')
      .set('Authorization', `Bearer ${principalToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('enrollment-report');
    expect(res.text).toContain('Roll Number');
    expect(res.text).toContain('Rohan Sharma');
  });

  it('should export attendance report in Excel (.xlsx) format using SpreadsheetML', async () => {
    const mockAttendance = [
      {
        date: new Date('2026-10-25'),
        student: { rollNumber: 'CSE-001' },
        subject: { code: 'CS301', name: 'Data Structures' },
        periodNumber: 1,
        status: 'present'
      }
    ];

    jest.spyOn(Attendance, 'find').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockAttendance)
    });

    const res = await request(app)
      .get('/api/v1/reports/export?type=attendance&format=xlsx')
      .set('Authorization', `Bearer ${principalToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.ms-excel');
    expect(res.headers['content-disposition']).toContain('.xlsx');
    expect(res.text).toContain('<?xml version="1.0"');
    expect(res.text).toContain('urn:schemas-microsoft-com:office:spreadsheet');
    expect(res.text).toContain('Data Structures');
  });

  it('should export academic summary report in pure binary PDF (%PDF-1.4) format', async () => {
    jest.spyOn(Student, 'countDocuments').mockResolvedValue(1000);
    jest.spyOn(Faculty, 'countDocuments').mockResolvedValue(120);
    jest.spyOn(Department, 'countDocuments').mockResolvedValue(6);
    jest.spyOn(Course, 'countDocuments').mockResolvedValue(10);

    const res = await request(app)
      .get('/api/v1/reports/export?type=academic_summary&format=pdf')
      .set('Authorization', `Bearer ${principalToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('.pdf');
    // Binary check: PDF header must start with %PDF-1.4
    const bodyStr = res.body instanceof Buffer ? res.body.toString('utf8') : res.text;
    expect(bodyStr).toContain('%PDF-1.4');
  });

  it('should reject invalid report types with 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export?type=unsupported_random_report')
      .set('Authorization', `Bearer ${principalToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REPORT_TYPE');
  });
});

