export const PRIORITY_META = {
  LOW: { label: 'Low', className: 'bg-surface-raised text-ink2-muted border border-border' },
  MEDIUM: { label: 'Medium', className: 'bg-thread-dim text-thread border border-thread/30' },
  HIGH: { label: 'High', className: 'bg-signal-dim text-signal border border-signal/30' },
  URGENT: { label: 'Urgent', className: 'bg-alert-dim text-alert border border-alert/30' },
};

export const STATUS_META = {
  TODO: { label: 'To Do', className: 'text-ink2-muted' },
  IN_PROGRESS: { label: 'In Progress', className: 'text-thread' },
  COMPLETED: { label: 'Completed', className: 'text-resolved' },
};

export const HEALTH_META = {
  ON_TRACK: { label: 'On Track', className: 'bg-resolved-dim text-resolved border border-resolved/30' },
  NEEDS_ATTENTION: { label: 'Needs Attention', className: 'bg-signal-dim text-signal border border-signal/30' },
  AT_RISK: { label: 'At Risk', className: 'bg-alert-dim text-alert border border-alert/30' },
};

export const SEVERITY_META = {
  INFO: { label: 'Info', className: 'bg-thread-dim text-thread border border-thread/30' },
  WARNING: { label: 'Warning', className: 'bg-signal-dim text-signal border border-signal/30' },
  CRITICAL: { label: 'Critical', className: 'bg-alert-dim text-alert border border-alert/30' },
};

export const KANBAN_COLUMNS = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'COMPLETED', title: 'Completed' },
];
