const prisma = require('../config/db');
const { ok, created, AppError } = require('../utils/apiResponse');
const { refreshProjectInsights } = require('../services/projectInsightService');

const taskInclude = { owner: true, dependsOn: { include: { dependsOnTask: true } } };

function serializeTask(t) {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline,
    confidence: t.confidence,
    source: t.source,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    owner: t.owner ? { id: t.owner.id, name: t.owner.name } : null,
    dependsOn: t.dependsOn.map((d) => ({ id: d.dependsOnTask.id, title: d.dependsOnTask.title, status: d.dependsOnTask.status })),
  };
}

async function listTasks(req, res) {
  const tasks = await prisma.task.findMany({
    where: { projectId: req.project.id },
    include: taskInclude,
    orderBy: { createdAt: 'asc' },
  });
  return ok(res, tasks.map(serializeTask));
}

async function createTask(req, res) {
  const { title, description, ownerId, status, priority, deadline, dependsOnTaskIds } = req.body;

  if (ownerId) {
    const owner = await prisma.projectMember.findUnique({ where: { id: ownerId } });
    if (!owner || owner.projectId !== req.project.id) throw new AppError('Owner is not a member of this project', 400);
  }

  const task = await prisma.$transaction(async (tx) => {
    const created_ = await tx.task.create({
      data: {
        projectId: req.project.id,
        title,
        description: description || null,
        ownerId: ownerId || null,
        status,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        source: 'MANUAL',
      },
    });

    for (const depId of dependsOnTaskIds || []) {
      const dep = await tx.task.findUnique({ where: { id: depId } });
      if (dep && dep.projectId === req.project.id) {
        await tx.taskDependency.create({ data: { taskId: created_.id, dependsOnTaskId: depId } });
      }
    }
    return created_;
  });

  const full = await prisma.task.findUnique({ where: { id: task.id }, include: taskInclude });
  await refreshProjectInsights(req.project.id);
  return created(res, serializeTask(full));
}

async function findOwnedTask(taskId, userId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) throw new AppError('Task not found', 404);
  const hasAccess = task.project.ownerId === userId || task.project.members.some((m) => m.userId === userId);
  if (!hasAccess) throw new AppError('You do not have access to this task', 403);
  return task;
}

async function updateTask(req, res) {
  const task = await findOwnedTask(req.params.id, req.user.id);

  const data = { ...req.body };
  if (data.deadline !== undefined) {
    data.deadline = data.deadline ? new Date(data.deadline) : null;
  }

  const updated = await prisma.task.update({ where: { id: task.id }, data, include: taskInclude });
  await refreshProjectInsights(task.projectId);
  return ok(res, serializeTask(updated));
}

async function deleteTask(req, res) {
  const task = await findOwnedTask(req.params.id, req.user.id);
  await prisma.task.delete({ where: { id: task.id } });
  await refreshProjectInsights(task.projectId);
  return ok(res, { deleted: true });
}

async function updateTaskStatus(req, res) {
  const task = await findOwnedTask(req.params.id, req.user.id);
  const { status } = req.body;

  const updated = await prisma.task.update({ where: { id: task.id }, data: { status }, include: taskInclude });
  await refreshProjectInsights(task.projectId);
  return ok(res, serializeTask(updated));
}

module.exports = { listTasks, createTask, updateTask, deleteTask, updateTaskStatus };
