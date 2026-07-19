const prisma = require('../config/db');
const { ok, created, AppError } = require('../utils/apiResponse');
const { notifyProjectEvent } = require('../services/notificationService');

async function listMembers(req, res) {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.project.id },
    orderBy: { createdAt: 'asc' },
  });
  return ok(res, members);
}

async function addMember(req, res) {
  const { name, email, role } = req.body;

  if (email) {
    const existing = await prisma.projectMember.findFirst({ where: { projectId: req.project.id, email } });
    if (existing) throw new AppError('This email is already a member of the project', 409);
  }

  // Note: this service has no direct access to the Users table (auth-service
  // owns it), so we can't auto-link an added member to an existing account
  // by email lookup without a network call. userId stays null unless the
  // member IS the person making the request (handled at project-creation
  // time in projectController). They'll still receive project access once
  // they're matched by email in a future login-time reconciliation step —
  // documented as an MVP simplification.
  const member = await prisma.projectMember.create({
    data: {
      projectId: req.project.id,
      name,
      email: email || null,
      role: role || 'MEMBER',
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: req.project.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'MEMBER_ADDED',
      metadata: JSON.stringify({ name }),
    },
  });

  await notifyProjectEvent(req.project.id, {
    title: 'New team member added',
    message: `${name} was added to the project by ${req.user.name}.`,
  }).catch(() => {});

  return created(res, member);
}

async function updateMember(req, res) {
  const member = await prisma.projectMember.findUnique({ where: { id: req.params.memberId } });
  if (!member || member.projectId !== req.project.id) throw new AppError('Member not found', 404);

  const updated = await prisma.projectMember.update({
    where: { id: req.params.memberId },
    data: req.body,
  });
  return ok(res, updated);
}

async function removeMember(req, res) {
  const member = await prisma.projectMember.findUnique({ where: { id: req.params.memberId } });
  if (!member || member.projectId !== req.project.id) throw new AppError('Member not found', 404);

  if (member.role === 'OWNER') {
    throw new AppError('Cannot remove the project owner', 400);
  }

  // Unassign their tasks rather than cascading a destructive delete —
  // losing task history because a member left would be a data-loss bug.
  await prisma.$transaction([
    prisma.task.updateMany({ where: { ownerId: member.id }, data: { ownerId: null } }),
    prisma.projectMember.delete({ where: { id: member.id } }),
  ]);

  return ok(res, { deleted: true });
}

module.exports = { listMembers, addMember, updateMember, removeMember };
