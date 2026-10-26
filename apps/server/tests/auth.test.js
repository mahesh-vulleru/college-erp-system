const request = require('supertest');
const app = require('../src/app');

describe('Authentication Validation Tests', () => {
  it('POST /api/v1/auth/login with missing body should fail with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/auth/login with invalid email format should return 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email-address',
        password: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain('Please provide a valid email format');
  });

  it('GET /api/v1/auth/me without Bearer token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Bearer token missing');
  });
});
