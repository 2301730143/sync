/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Must match auth-service/prisma/seed.js's DEMO_USER_ID exactly — this
// service has no Users table of its own, so it can't look the demo user up;
// it just trusts this ID was created by auth-service's seed script.
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_USER_NAME = 'Demo User';
const DEMO_USER_EMAIL = 'demo@syncmind.ai';

async function main() {
  const project = await prisma.project.create({
    data: {
      name: 'Final Year Project — Smart Attendance System',
      description: 'Seeded demo project so you can explore the UI immediately.',
      ownerId: DEMO_USER_ID,
      members: {
        create: [
          { userId: DEMO_USER_ID, name: DEMO_USER_NAME, email: DEMO_USER_EMAIL, role: 'OWNER' },
          { name: 'Priya Sharma', email: 'priya@example.com', role: 'MEMBER' },
          { name: 'Arjun Mehta', email: 'arjun@example.com', role: 'MEMBER' },
        ],
      },
    },
    include: { members: true },
  });

  const [owner, priya, arjun] = project.members;

  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        title: 'Design database schema',
        description: 'Model students, sessions, and attendance records.',
        ownerId: owner.id,
        status: 'COMPLETED',
        priority: 'HIGH',
        source: 'MANUAL',
      },
      {
        projectId: project.id,
        title: 'Build face recognition module',
        ownerId: priya.id,
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        source: 'MANUAL',
      },
      {
        projectId: project.id,
        title: 'Set up REST API',
        ownerId: arjun.id,
        status: 'TODO',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        source: 'MANUAL',
      },
      {
        projectId: project.id,
        title: 'Write project report',
        status: 'TODO',
        priority: 'MEDIUM',
        source: 'MANUAL',
      },
    ],
  });

  console.log(`[project-service] Seeded project "${project.name}" owned by ${DEMO_USER_EMAIL}`);
  console.log('[project-service] Log in with demo@syncmind.ai / password123 (seeded by auth-service) to see it.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
