/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Fixed UUID so project-service's seed script can reference this exact user
// as a project owner/member without the two services needing to talk to
// each other during seeding. Keep this in sync with
// project-service/prisma/seed.js's DEMO_USER_ID.
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      name: 'Demo User',
      email: 'demo@syncmind.ai',
      passwordHash,
      avatarColor: '#6366f1',
    },
  });

  console.log(`[auth-service] Seeded demo user: ${user.email} / password123 (id: ${user.id})`);
  console.log('[auth-service] Now run "npm run prisma:seed" in project-service to seed a demo project for this user.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
