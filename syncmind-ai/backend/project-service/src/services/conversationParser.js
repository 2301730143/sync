const prisma = require('../config/db');

// Finds a project member whose name loosely matches the AI-extracted owner
// string (case-insensitive, either direction substring match). Returns null
// (Unassigned) rather than guessing when nothing matches — we never invent data.
function matchOwner(ownerName, members) {
  if (!ownerName) return null;
  const needle = ownerName.trim().toLowerCase();
  if (!needle) return null;

  const exact = members.find((m) => m.name.trim().toLowerCase() === needle);
  if (exact) return exact.id;

  const partial = members.find(
    (m) => m.name.toLowerCase().includes(needle) || needle.includes(m.name.toLowerCase())
  );
  return partial ? partial.id : null;
}

/**
 * Persists a confirmed AIAnalysis into real Task/Decision/TaskDependency rows.
 * Runs as a single transaction: if anything fails partway, nothing is
 * committed, avoiding a half-generated project.
 */
async function generateProjectFromAnalysis({ projectId, analysis }) {
  const members = await prisma.projectMember.findMany({ where: { projectId } });

  return prisma.$transaction(async (tx) => {
    // 1. Create all tasks first (dependencies reference titles, so we need IDs).
    const titleToId = new Map();
    const createdTasks = [];

    for (const t of analysis.tasks) {
      const ownerId = matchOwner(t.owner, members);
      const created = await tx.task.create({
        data: {
          projectId,
          title: t.title,
          description: t.description || null,
          ownerId,
          priority: t.priority,
          status: 'TODO',
          deadline: t.deadline ? new Date(t.deadline) : null,
          confidence: t.confidence,
          source: 'AI',
        },
      });
      titleToId.set(t.title.trim().toLowerCase(), created.id);
      createdTasks.push(created);
    }

    // 2. Wire up dependencies now that every task has an ID. Silently skip
    //    any dependency that doesn't resolve to a task we just created —
    //    never invent a task to satisfy a dangling reference.
    for (const t of analysis.tasks) {
      const taskId = titleToId.get(t.title.trim().toLowerCase());
      for (const depTitle of t.dependencies || []) {
        const dependsOnTaskId = titleToId.get(depTitle.trim().toLowerCase());
        if (dependsOnTaskId && dependsOnTaskId !== taskId) {
          await tx.taskDependency.upsert({
            where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
            update: {},
            create: { taskId, dependsOnTaskId },
          });
        }
      }
    }

    // 3. Persist decisions.
    for (const d of analysis.decisions) {
      await tx.decision.create({
        data: { projectId, summary: d.summary, context: d.context || null },
      });
    }

    // 4. Log activity.
    await tx.activityLog.create({
      data: {
        projectId,
        action: 'AI_ANALYSIS_CONFIRMED',
        metadata: JSON.stringify({ taskCount: createdTasks.length, decisionCount: analysis.decisions.length }),
      },
    });

    return { tasks: createdTasks, decisionsCreated: analysis.decisions.length };
  });
}

module.exports = { generateProjectFromAnalysis, matchOwner };
