import { Link } from 'react-router-dom';
import { Users, ListChecks, CalendarClock } from 'lucide-react';
import { HEALTH_META } from '../../utils/taskMeta';
import { deadlineLabel } from '../../utils/format';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="card p-5 flex flex-col hover:border-signal/40 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display font-semibold text-[15px] leading-snug pr-2 group-hover:text-signal transition-colors">
          {project.name}
        </h3>
        <span className={`badge shrink-0 ${HEALTH_META[project.health]?.className}`}>{HEALTH_META[project.health]?.label}</span>
      </div>

      {project.description && <p className="text-sm text-ink2-muted line-clamp-2 mb-4">{project.description}</p>}

      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-ink2-muted mb-1.5">
          <span>Progress</span>
          <span>{project.completedTasks}/{project.totalTasks} tasks</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden mb-4">
          <div className="h-full bg-signal rounded-full transition-all" style={{ width: `${project.progress}%` }} />
        </div>

        <div className="flex items-center gap-4 text-xs text-ink2-muted">
          <span className="flex items-center gap-1"><Users size={13} /> {project.teamSize}</span>
          <span className="flex items-center gap-1"><ListChecks size={13} /> {project.totalTasks}</span>
          {project.upcomingDeadline && (
            <span className="flex items-center gap-1"><CalendarClock size={13} /> {deadlineLabel(project.upcomingDeadline)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
