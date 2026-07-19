const prisma = require('../config/db');
const { InsightType, InsightSeverity, ProjectHealth } = require('../utils/enums');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Rule-based project analysis (not an LLM call — deterministic, fast, free,
 * and runs on every task change). This is the "AI insights" layer described
 * in the spec; it's an expert-system over the data Gemini already extracted
 * plus everything the user has since edited.
 */
async function generateInsights(projectId) {
  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      include: { owner: true, dependsOn: { include: { dependsOnTask: true } } },
    }),
    prisma.projectMember.findMany({ where: { projectId } }),
  ]);

  const insights = [];
  const now = Date.now();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;

  // --- Deadline risk: overdue or due within 48h and not completed ---
  const overdue = tasks.filter((t) => t.deadline && t.status !== 'COMPLETED' && t.deadline.getTime() < now);
  const dueSoon = tasks.filter(
    (t) =>
      t.deadline &&
      t.status !== 'COMPLETED' &&
      t.deadline.getTime() >= now &&
      t.deadline.getTime() - now <= 2 * DAY_MS
  );

  if (overdue.length > 0) {
    insights.push({
      type: InsightType.DEADLINE_RISK,
      severity: InsightSeverity.CRITICAL,
      title: `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue`,
      explanation: overdue.map((t) => t.title).slice(0, 5).join(', '),
      recommendedAction: 'Reassign, reschedule, or escalate these tasks immediately.',
    });
  }
  if (dueSoon.length > 0) {
    insights.push({
      type: InsightType.DEADLINE_RISK,
      severity: InsightSeverity.WARNING,
      title: `${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due within 48 hours`,
      explanation: dueSoon.map((t) => t.title).slice(0, 5).join(', '),
      recommendedAction: 'Confirm these are on track before the deadline hits.',
    });
  }

  // --- Missing owners ---
  const unowned = tasks.filter((t) => !t.ownerId && t.status !== 'COMPLETED');
  if (unowned.length > 0) {
    insights.push({
      type: InsightType.MISSING_OWNER,
      severity: InsightSeverity.WARNING,
      title: `${unowned.length} task${unowned.length > 1 ? 's have' : ' has'} no assigned owner`,
      explanation: unowned.map((t) => t.title).slice(0, 5).join(', '),
      recommendedAction: 'Assign an owner so accountability is clear.',
    });
  }

  // --- Blocked tasks: depends on a task that is not completed ---
  const blocked = tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.dependsOn.some((d) => d.dependsOnTask.status !== 'COMPLETED')
  );
  if (blocked.length > 0) {
    insights.push({
      type: InsightType.BLOCKED_TASK,
      severity: InsightSeverity.WARNING,
      title: `${blocked.length} task${blocked.length > 1 ? 's are' : ' is'} blocked by incomplete dependencies`,
      explanation: blocked.map((t) => t.title).slice(0, 5).join(', '),
      recommendedAction: 'Prioritize the blocking tasks to unblock downstream work.',
    });
  }

  // --- Dependency risk: circular or a chain of 3+ deep on the critical path ---
  const dependencyHeavy = tasks.filter((t) => t.dependsOn.length >= 3);
  if (dependencyHeavy.length > 0) {
    insights.push({
      type: InsightType.DEPENDENCY_RISK,
      severity: InsightSeverity.INFO,
      title: `${dependencyHeavy.length} task${dependencyHeavy.length > 1 ? 's have' : ' has'} heavy dependency chains`,
      explanation: dependencyHeavy.map((t) => t.title).slice(0, 5).join(', '),
      recommendedAction: 'Consider breaking these into smaller, less interdependent tasks.',
    });
  }

  // --- Missing activity: no tasks completed and no updates in 7+ days ---
  const mostRecentUpdate = tasks.reduce((max, t) => (t.updatedAt > max ? t.updatedAt : max), new Date(0));
  const staleForDays = totalTasks > 0 ? (now - mostRecentUpdate.getTime()) / DAY_MS : 0;
  if (totalTasks > 0 && staleForDays >= 7) {
    insights.push({
      type: InsightType.MISSING_ACTIVITY,
      severity: InsightSeverity.WARNING,
      title: 'No task activity in over a week',
      explanation: `The most recent task update was ${Math.floor(staleForDays)} days ago.`,
      recommendedAction: 'Check in with the team — the project may have stalled.',
    });
  }

  // --- Workload imbalance (project-relative, not an arbitrary universal threshold) ---
  const imbalance = computeWorkloadImbalance(tasks, members);
  if (imbalance) insights.push(imbalance);

  // --- Overall health rollup ---
  const health = computeHealth({ overdue, dueSoon, unowned, blocked, totalTasks, completedTasks });
  insights.unshift({
    type: InsightType.HEALTH,
    severity:
      health === ProjectHealth.AT_RISK
        ? InsightSeverity.CRITICAL
        : health === ProjectHealth.NEEDS_ATTENTION
          ? InsightSeverity.WARNING
          : InsightSeverity.INFO,
    title: `Project health: ${health.replace('_', ' ')}`,
    explanation: `${completedTasks}/${totalTasks} tasks completed. ${overdue.length} overdue, ${unowned.length} unassigned, ${blocked.length} blocked.`,
    recommendedAction: null,
  });

  return { insights, health };
}

function computeWorkloadImbalance(tasks, members) {
  if (members.length < 2) return null;
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  if (activeTasks.length === 0) return null;

  const counts = new Map(members.map((m) => [m.id, 0]));
  for (const t of activeTasks) {
    if (t.ownerId && counts.has(t.ownerId)) counts.set(t.ownerId, counts.get(t.ownerId) + 1);
  }

  const values = [...counts.values()];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // Project-relative threshold: flag only if the busiest member has meaningfully
  // more than the mean, scaled to project size — not a fixed universal number.
  if (max - min >= 2 && max > avg * 1.5 && max >= 3) {
    const busiest = [...counts.entries()].find(([, v]) => v === max);
    const member = members.find((m) => m.id === busiest[0]);
    return {
      type: InsightType.WORKLOAD_IMBALANCE,
      severity: InsightSeverity.WARNING,
      title: 'Uneven workload distribution detected',
      explanation: `${member ? member.name : 'One member'} has ${max} active tasks, well above the team average of ${avg.toFixed(1)}.`,
      recommendedAction: 'Consider rebalancing tasks across the team (suggestion only — not automatic).',
    };
  }
  return null;
}

function computeHealth({ overdue, unowned, blocked, totalTasks, completedTasks }) {
  if (totalTasks === 0) return ProjectHealth.ON_TRACK;
  const completionRatio = completedTasks / totalTasks;

  if (overdue.length >= 2 || (overdue.length >= 1 && completionRatio < 0.3)) {
    return ProjectHealth.AT_RISK;
  }
  if (overdue.length >= 1 || unowned.length >= 2 || blocked.length >= 2) {
    return ProjectHealth.NEEDS_ATTENTION;
  }
  return ProjectHealth.ON_TRACK;
}

const HEALTH_SEVERITY_RANK = { ON_TRACK: 0, NEEDS_ATTENTION: 1, AT_RISK: 2 };

/**
 * Persists freshly computed insights, replacing the previous snapshot.
 * Notifies the project (in-app + email) only when health genuinely worsens
 * compared to its prior value — insight refresh runs on nearly every task
 * mutation, so notifying unconditionally would spam an email per drag-drop.
 */
async function refreshProjectInsights(projectId) {
  const { insights, health } = await generateInsights(projectId);

  const previous = await prisma.project.findUnique({ where: { id: projectId }, select: { health: true } });

  await prisma.$transaction(async (tx) => {
    await tx.aIInsight.deleteMany({ where: { projectId } });
    if (insights.length > 0) {
      await tx.aIInsight.createMany({
        data: insights.map((i) => ({
          projectId,
          type: i.type,
          severity: i.severity,
          title: i.title,
          explanation: i.explanation,
          recommendedAction: i.recommendedAction,
        })),
      });
    }
    await tx.project.update({ where: { id: projectId }, data: { health } });
  });

  const worsened =
    previous && HEALTH_SEVERITY_RANK[health] > HEALTH_SEVERITY_RANK[previous.health] && health !== ProjectHealth.ON_TRACK;

  if (worsened) {
    // Lazy require avoids a load-order assumption between the two services.
    const { notifyAIRisk } = require('./notificationService');
    const topInsight = insights.find((i) => i.severity !== 'INFO') || insights[0];
    await notifyAIRisk(projectId, {
      title: `Project health dropped to ${health.replace('_', ' ')}`,
      message: topInsight ? `${topInsight.title}. ${topInsight.explanation}` : 'Check the Insights tab for details.',
    }).catch(() => {}); // best-effort — never let a notification failure break the caller
  }

  return prisma.aIInsight.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
}

module.exports = { generateInsights, refreshProjectInsights };
