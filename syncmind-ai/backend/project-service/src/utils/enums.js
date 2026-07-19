// Central enum definitions. SQLite has no native enum type, so these are
// enforced here + validated at the API boundary with zod. If you migrate the
// Prisma datasource to postgresql, these map 1:1 onto real Prisma enums.

const TaskStatus = Object.freeze({
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

const TaskPriority = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

const ProjectHealth = Object.freeze({
  ON_TRACK: 'ON_TRACK',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  AT_RISK: 'AT_RISK',
});

const InsightSeverity = Object.freeze({
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
});

const InsightType = Object.freeze({
  HEALTH: 'HEALTH',
  DEADLINE_RISK: 'DEADLINE_RISK',
  MISSING_OWNER: 'MISSING_OWNER',
  BLOCKED_TASK: 'BLOCKED_TASK',
  DEPENDENCY_RISK: 'DEPENDENCY_RISK',
  MISSING_ACTIVITY: 'MISSING_ACTIVITY',
  WORKLOAD_IMBALANCE: 'WORKLOAD_IMBALANCE',
});

const NotificationType = Object.freeze({
  DEADLINE: 'DEADLINE',
  AI_RISK: 'AI_RISK',
  PROJECT_EVENT: 'PROJECT_EVENT',
});

const ProjectRole = Object.freeze({
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
});

const ConversationSource = Object.freeze({
  WHATSAPP: 'WHATSAPP',
  DISCORD: 'DISCORD',
  SLACK: 'SLACK',
  TEAMS: 'TEAMS',
  NOTES: 'NOTES',
  PASTE: 'PASTE',
  UPLOAD: 'UPLOAD',
});

module.exports = {
  TaskStatus,
  TaskPriority,
  ProjectHealth,
  InsightSeverity,
  InsightType,
  NotificationType,
  ProjectRole,
  ConversationSource,
};
