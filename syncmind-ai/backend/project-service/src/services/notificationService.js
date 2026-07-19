const prisma = require('../config/db');
const { NotificationType } = require('../utils/enums');
const { sendNotificationEmail } = require('./emailService');
const env = require('../config/env');

/**
 * Notifies every project member: creates an in-app notification for anyone
 * with a linked userId, and best-effort emails anyone with an email on file.
 * This service has no direct access to the Users table (auth-service owns
 * it) — it relies entirely on the denormalized name/email/userId already
 * stored on ProjectMember, which is populated when a member is added. As a
 * result, the per-account "email notifications off" preference (stored in
 * auth-service) isn't checked here — an accepted MVP simplification; see
 * README for the tradeoff and how to close it with a lightweight internal
 * lookup if needed.
 *
 * Email failures never throw — this runs inline after mutations (task
 * moves, AI confirm, etc.) and must never break the request that triggered it.
 */
async function notifyProject(projectId, { type, title, message, ctaPath }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project || project.members.length === 0) return;

  const withAccount = project.members.filter((m) => m.userId);
  if (withAccount.length > 0) {
    await prisma.notification.createMany({
      data: withAccount.map((m) => ({ userId: m.userId, type, title, message, projectId })),
    });
  }

  const ctaUrl = ctaPath ? `${env.CLIENT_URL}${ctaPath}` : undefined;

  // Fire-and-forget in parallel, but don't let a rejected promise surface —
  // each call already catches internally, this is just defense in depth.
  await Promise.allSettled(
    project.members
      .filter((m) => m.email)
      .map((m) =>
        sendNotificationEmail({
          to: m.email,
          subject: `${title} — ${project.name}`,
          title,
          message,
          ctaLabel: 'Open project',
          ctaUrl,
        })
      )
  );
}

async function notifyDeadlineRisks(projectId, overdueOrSoonTasks) {
  if (overdueOrSoonTasks.length === 0) return;
  await notifyProject(projectId, {
    type: NotificationType.DEADLINE,
    title: 'Upcoming or overdue deadlines',
    message: `${overdueOrSoonTasks.length} task(s) need attention: ${overdueOrSoonTasks
      .map((t) => t.title)
      .slice(0, 3)
      .join(', ')}`,
    ctaPath: `/projects/${projectId}/timeline`,
  });
}

async function notifyAIRisk(projectId, { title, message }) {
  await notifyProject(projectId, {
    type: NotificationType.AI_RISK,
    title,
    message,
    ctaPath: `/projects/${projectId}/insights`,
  });
}

async function notifyProjectEvent(projectId, { title, message }) {
  await notifyProject(projectId, {
    type: NotificationType.PROJECT_EVENT,
    title,
    message,
    ctaPath: `/projects/${projectId}/overview`,
  });
}

module.exports = { notifyProject, notifyDeadlineRisks, notifyAIRisk, notifyProjectEvent };
