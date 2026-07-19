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
  PORT: parseInt(process.env.PORT || '5001', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: required('DATABASE_URL', 'file:./dev.db'),
  // JWT_SECRET must be IDENTICAL to project-service's JWT_SECRET — auth-service
  // issues tokens, project-service verifies them locally without calling back
  // here. This is the only thing the two services need to agree on.
  JWT_SECRET: required('JWT_SECRET', 'dev_only_insecure_secret_change_me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_only_insecure_secret_change_me') {
  // eslint-disable-next-line no-console
  console.error('[env] Refusing to start in production with the default JWT_SECRET.');
  process.exit(1);
}

module.exports = env;
