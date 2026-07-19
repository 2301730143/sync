import { Link } from 'react-router-dom';
import { ListChecks, CheckCircle2, Users, CalendarClock, ArrowRight } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { StatCard, EmptyState } from '../components/common/Common';
import { SEVERITY_META } from '../utils/taskMeta';
import { formatRelative, deadlineLabel } from '../utils/format';
import { Sparkles, MessageSquareText } from 'lucide-react';

export default function ProjectOverview() {
  const { project, projectId } = useProjectContext();
  if (!project) return null;

  const insights = project.insights || [];
  const topInsights = insights.slice(0, 4);

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Progress" value={`${project.progress}%`} icon={CheckCircle2} accent="resolved" />
        <StatCard label="Total tasks" value={project.totalTasks} icon={ListChecks} accent="thread" />
        <StatCard label="Team size" value={project.teamSize} icon={Users} accent="signal" />
        <StatCard
          label="Next deadline"
          value={project.upcomingDeadline ? deadlineLabel(project.upcomingDeadline) : '—'}
          icon={CalendarClock}
          accent="alert"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold flex items-center gap-2"><Sparkles size={16} className="text-signal" /> AI Insights</h3>
            <Link to={`/projects/${projectId}/insights`} className="text-xs text-signal hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {topInsights.length === 0 ? (
            <EmptyState icon={Sparkles} title="No insights yet" description="Insights appear automatically once your project has tasks." />
          ) : (
            <div className="space-y-3">
              {topInsights.map((i) => (
                <div key={i.id} className="flex items-start gap-3 py-2 border-b border-border-soft last:border-0">
                  <span className={`badge shrink-0 mt-0.5 ${SEVERITY_META[i.severity]?.className}`}>{SEVERITY_META[i.severity]?.label}</span>
                  <div>
                    <p className="text-sm font-medium text-ink2-primary">{i.title}</p>
                    <p className="text-xs text-ink2-muted mt-0.5">{i.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold mb-4">Recent activity</h3>
          {(!project.recentActivity || project.recentActivity.length === 0) ? (
            <EmptyState title="No activity yet" description="Actions across the project will show up here." />
          ) : (
            <div className="space-y-3">
              {project.recentActivity.map((a) => (
                <div key={a.id} className="text-sm">
                  <p className="text-ink2-primary">{formatAction(a.action)}</p>
                  <p className="text-xs text-ink2-faint">{a.user || 'System'} · {formatRelative(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-thread-dim flex items-center justify-center">
            <MessageSquareText size={17} className="text-thread" />
          </div>
          <div>
            <p className="text-sm font-medium">Have a new conversation to import?</p>
            <p className="text-xs text-ink2-muted">Paste it in and let AI extract the next batch of tasks.</p>
          </div>
        </div>
        <Link to={`/projects/${projectId}/conversations`} className="btn-primary">Import conversation</Link>
      </div>
    </div>
  );
}

function formatAction(action) {
  const map = {
    PROJECT_CREATED: 'Project created',
    MEMBER_ADDED: 'Team member added',
    CONVERSATION_IMPORTED: 'Conversation imported',
    AI_ANALYSIS_CONFIRMED: 'AI analysis confirmed — tasks generated',
  };
  return map[action] || action;
}
