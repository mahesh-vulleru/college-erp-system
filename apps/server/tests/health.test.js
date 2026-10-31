const request = require('supertest');
const app = require('../src/app');

describe('Health Check API Endpoint', () => {
  it('GET /api/health should return 200 with service status and metadata', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('database');
    expect(res.body.service).toBe('college-erp-api');
  });

  it('GET /api/non-existent-route should return 404 with structured JSON error', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('not found');
  });
});
