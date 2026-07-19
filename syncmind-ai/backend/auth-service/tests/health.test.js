const request = require('supertest');

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
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('auth-service');
  });
});

describe('POST /register validation', () => {
  it('rejects a short password', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Test User', email: 'test@example.com', password: '123' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Test User', email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(422);
  });
});

describe('GET /profile', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/profile');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed token', async () => {
    const res = await request(app).get('/profile').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
