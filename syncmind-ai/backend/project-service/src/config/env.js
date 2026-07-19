require('dotenv').config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5002', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: required('DATABASE_URL', 'file:./dev.db'),
  // MUST be the exact same value as auth-service's JWT_SECRET — this service
  // verifies tokens locally (no network call back to auth-service).
  JWT_SECRET: required('JWT_SECRET', 'dev_only_insecure_secret_change_me'),
  GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),
  GEMINI_MODEL: (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '2', 10),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'SyncMind AI <notifications@syncmind.ai>',
};

env.AI_MOCK_MODE = !env.GEMINI_API_KEY;
env.EMAIL_MOCK_MODE = !env.SMTP_HOST;

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_only_insecure_secret_change_me') {
  // eslint-disable-next-line no-console
  console.error('[env] Refusing to start in production with the default JWT_SECRET.');
  process.exit(1);
}

module.exports = env;
