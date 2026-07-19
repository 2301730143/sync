const prisma = require('../config/db');
const { ok, created, AppError } = require('../utils/apiResponse');
const { refreshProjectInsights } = require('../services/projectInsightService');

function summarize(project) {
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
  const upcoming = project.tasks
    .filter((t) => t.deadline && t.status !== 'COMPLETED')
    .sort((a, b) => a.deadline - b.deadline)[0];

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    health: project.health,
    ownerId: project.ownerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    teamSize: project.members.length,
    totalTasks,
    completedTasks,
    progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    upcomingDeadline: upcoming ? upcoming.deadline : null,
  };
}

async function listProjects(req, res) {
  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: req.user.id }, { members: { some: { userId: req.user.id } } }],
    },
    include: { members: true, tasks: true },
    orderBy: { updatedAt: 'desc' },
  });
  return ok(res, projects.map(summarize));
}

async function createProject(req, res) {
  const { name, description } = req.body;

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: { name, description: description || null, ownerId: req.user.id },
    });
    // The creator is automatically a project member with OWNER role, so
    // membership queries (and task ownership) work uniformly.
    await tx.projectMember.create({
      data: { projectId: p.id, userId: req.user.id, name: req.user.name, email: req.user.email, role: 'OWNER' },
    });
    await tx.activityLog.create({
      data: { projectId: p.id, userId: req.user.id, userName: req.user.name, action: 'PROJECT_CREATED' },
    });
    return p;
  });

  const full = await prisma.project.findUnique({ where: { id: project.id }, include: { members: true, tasks: true } });
  return created(res, summarize(full));
}

async function getProject(req, res) {
  const full = await prisma.project.findUnique({
    where: { id: req.project.id },
    include: { members: true, tasks: true },
  });
  return ok(res, summarize(full));
}

async function updateProject(req, res) {
  if (!req.isProjectOwner) {
    throw new AppError('Only the project owner can edit project settings', 403);
  }
  const updated = await prisma.project.update({
    where: { id: req.project.id },
    data: req.body,
    include: { members: true, tasks: true },
  });
  return ok(res, summarize(updated));
}

async function deleteProject(req, res) {
  if (!req.isProjectOwner) {
    throw new AppError('Only the project owner can delete this project', 403);
  }
  await prisma.project.delete({ where: { id: req.project.id } });
  return ok(res, { deleted: true });
}

async function getOverview(req, res) {
  const [full, insights] = await Promise.all([
    prisma.project.findUnique({
      where: { id: req.project.id },
      include: {
        members: true,
        tasks: { include: { owner: true } },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    }),
    refreshProjectInsights(req.project.id),
  ]);

  return ok(res, {
    ...summarize(full),
    recentActivity: full.activityLogs.map((a) => ({
      id: a.id,
      action: a.action,
      user: a.userName || null,
      createdAt: a.createdAt,
    })),
    insights,
  });
}

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject, getOverview };
