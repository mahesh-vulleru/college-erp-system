const request = require('supertest');
const express = require('express');
const { authorizeRoles, requirePermissions } = require('../src/middleware/rbac');
const { ROLES, PERMISSIONS } = require('@college-erp/shared');

describe('RBAC Middleware Authorization Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware simulator attaching req.user
    app.use((req, res, next) => {
      const simulatedRole = req.headers['x-simulated-role'];
      if (simulatedRole) {
        req.user = {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test Actor',
          email: 'test@college.edu',
          role: simulatedRole
        };
      }
      next();
    });

    // Protected route requiring Super Admin or Principal
    app.get(
      '/admin-only',
      authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
      (req, res) => res.status(200).json({ success: true, message: 'Granted' })
    );

    // Protected route requiring specific permission (e.g. ATTENDANCE_MARK)
    app.post(
      '/attendance-mark',
      requirePermissions(PERMISSIONS.ATTENDANCE_MARK),
      (req, res) => res.status(200).json({ success: true, message: 'Granted' })
    );
  });

  it('rejects unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app).get('/admin-only');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unauthorized role (Student accessing Admin route) with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/admin-only')
      .set('x-simulated-role', ROLES.STUDENT);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('does not have permission');
  });

  it('allows authorized role (Principal accessing Admin route) with 200 OK', async () => {
    const res = await request(app)
      .get('/admin-only')
      .set('x-simulated-role', ROLES.PRINCIPAL);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects Student role attempting to mark attendance with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/attendance-mark')
      .set('x-simulated-role', ROLES.STUDENT);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient permissions');
  });

  it('allows Faculty role possessing ATTENDANCE_MARK permission with 200 OK', async () => {
    const res = await request(app)
      .post('/attendance-mark')
      .set('x-simulated-role', ROLES.FACULTY);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

