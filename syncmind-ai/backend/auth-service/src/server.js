const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[auth-service] running on http://localhost:${env.PORT}`);
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n[auth-service] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
