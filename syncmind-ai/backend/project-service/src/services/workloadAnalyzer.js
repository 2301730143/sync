const prisma = require('../config/db');

/**
 * Per-member workload breakdown for Recharts on the frontend.
 * Classification is relative to the project's own average, never a fixed
 * universal threshold (a 2-person project and a 10-person project shouldn't
 * use the same "high workload" cutoff).
 */
async function analyzeWorkload(projectId) {
  const [members, tasks] = await Promise.all([
    prisma.projectMember.findMany({ where: { projectId } }),
    prisma.task.findMany({ where: { projectId } }),
  ]);

  const byMember = members.map((m) => {
    const memberTasks = tasks.filter((t) => t.ownerId === m.id);
    const pending = memberTasks.filter((t) => t.status !== 'COMPLETED').length;
    const completed = memberTasks.filter((t) => t.status === 'COMPLETED').length;
    const highPriority = memberTasks.filter(
      (t) => t.status !== 'COMPLETED' && (t.priority === 'HIGH' || t.priority === 'URGENT')
    ).length;

    return {
      memberId: m.id,
      name: m.name,
      totalTasks: memberTasks.length,
      pendingTasks: pending,
      completedTasks: completed,
      highPriorityTasks: highPriority,
    };
  });

  const unassignedCount = tasks.filter((t) => !t.ownerId).length;

  const pendingCounts = byMember.map((m) => m.pendingTasks);
  const avgPending = pendingCounts.length ? pendingCounts.reduce((a, b) => a + b, 0) / pendingCounts.length : 0;

  const classified = byMember.map((m) => {
    let classification = 'BALANCED';
    if (avgPending > 0) {
      if (m.pendingTasks >= avgPending * 1.5 && m.pendingTasks >= 3) classification = 'HIGH_WORKLOAD';
      else if (m.pendingTasks <= avgPending * 0.5) classification = 'UNDERUTILIZED';
    } else if (m.pendingTasks === 0) {
      classification = 'UNDERUTILIZED';
    }
    return { ...m, classification };
  });

  const recommendations = classified
    .filter((m) => m.classification === 'HIGH_WORKLOAD')
    .map((m) => ({
      memberId: m.memberId,
      suggestion: `${m.name} has a notably higher pending task load (${m.pendingTasks}) than the team average (${avgPending.toFixed(1)}). Consider redistributing some tasks — this is a suggestion, not an automatic reassignment.`,
    }));

  return {
    members: classified,
    unassignedTaskCount: unassignedCount,
    teamAveragePending: Number(avgPending.toFixed(2)),
    recommendations,
  };
}

module.exports = { analyzeWorkload };
