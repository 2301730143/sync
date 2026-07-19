const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[project-service] running on http://localhost:${env.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[project-service] AI mode: ${env.AI_MOCK_MODE ? 'MOCK' : 'LIVE (Gemini)'} | Email mode: ${env.EMAIL_MOCK_MODE ? 'MOCK' : 'LIVE (SMTP)'}`);
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n[project-service] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
