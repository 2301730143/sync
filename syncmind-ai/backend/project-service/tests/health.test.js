const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_jest_only';

const { execSync } = require('child_process');
const app = require('../src/app');

beforeAll(() => {
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'ignore',
  });
});

describe('GET /health', () => {
  it('returns ok status and reports mock modes', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('project-service');
    expect(typeof res.body.data.aiMockMode).toBe('boolean');
  });
});

describe('Auth middleware (local JWT verification)', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed token', async () => {
    const res = await request(app).get('/projects').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('accepts a token signed with the shared secret, without calling auth-service', async () => {
    // Proves the microservice boundary: project-service verifies the JWT
    // entirely locally using JWT_SECRET, no network call to auth-service.
    const token = jwt.sign({ sub: 'fake-user-id', name: 'Test User', email: 'test@example.com' }, process.env.JWT_SECRET);
    const res = await request(app).get('/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
