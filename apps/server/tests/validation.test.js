const request = require('supertest');
const express = require('express');
const validateRequest = require('../src/middleware/validate');
const { validateDepartmentInput } = require('../src/modules/departments/department.validator');
const { validateNoticeInput } = require('../src/modules/notices/notice.validator');

describe('Request Validation & Sanitization Middleware Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.post(
      '/test/departments',
      validateRequest(validateDepartmentInput),
      (req, res) => res.status(200).json({ success: true, data: req.body })
    );

    app.post(
      '/test/notices',
      validateRequest(validateNoticeInput),
      (req, res) => res.status(200).json({ success: true, data: req.body })
    );
  });

  it('rejects missing required fields with 400 Bad Request and detailed errors', async () => {
    const res = await request(app)
      .post('/test/departments')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain('Department name is required');
    expect(res.body.errors).toContain('Department code is required');
  });

  it('sanitizes trailing whitespace in string inputs automatically', async () => {
    const res = await request(app)
      .post('/test/departments')
      .send({
        name: '   Computer Science   ',
        code: '  CSE  '
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Computer Science');
    expect(res.body.data.code).toBe('CSE');
  });

  it('rejects notice input without content with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/test/notices')
      .send({
        title: 'Holiday Notice'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toContain('Notice content is required');
  });
});

