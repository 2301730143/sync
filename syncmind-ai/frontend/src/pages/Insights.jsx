import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, RefreshCw, Gauge } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { projectService } from '../services/projectService';
import { EmptyState, Skeleton } from '../components/common/Common';
import { SEVERITY_META } from '../utils/taskMeta';

const WORKLOAD_COLORS = {
  HIGH_WORKLOAD: '#F2545B',
  BALANCED: '#5B8DEF',
  UNDERUTILIZED: '#5B6079',
};

export default function Insights() {
  const { projectId, project, refreshOverview } = useProjectContext();
  const [regenerating, setRegenerating] = useState(false);
  const [workload, setWorkload] = useState(null);
  const [loadingWorkload, setLoadingWorkload] = useState(true);

  const insights = project?.insights || [];

  useEffect(() => {
    projectService
      .workloadAnalysis(projectId)
      .then((res) => setWorkload(res.data))
      .catch(() => {})
      .finally(() => setLoadingWorkload(false));
  }, [projectId]);

  async function regenerate() {
    setRegenerating(true);
    try {
      await refreshOverview();
      const res = await projectService.workloadAnalysis(projectId);
      setWorkload(res.data);
      toast.success('Insights refreshed');
    } catch (err) {
      toast.error(err.message || 'Could not refresh insights');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Sparkles size={17} className="text-signal" /> AI project insights
        </h3>
        <button className="btn-secondary" onClick={regenerate} disabled={regenerating}>
          <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="card"><EmptyState icon={Sparkles} title="No insights yet" description="Insights are generated automatically as your project gets tasks, deadlines, and owners." /></div>
      ) : (
        <div className="space-y-3">
          {insights.map((i) => (
            <div key={i.id} className="card p-4 flex items-start gap-3">
              <span className={`badge shrink-0 mt-0.5 ${SEVERITY_META[i.severity]?.className}`}>{SEVERITY_META[i.severity]?.label}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink2-primary">{i.title}</p>
                <p className="text-sm text-ink2-muted mt-0.5">{i.explanation}</p>
                {i.recommendedAction && (
                  <p className="text-xs text-signal mt-1.5">Suggested: {i.recommendedAction}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-display font-semibold flex items-center gap-2 mb-1">
          <Gauge size={17} className="text-thread" /> Workload balance
        </h3>
        <p className="text-xs text-ink2-muted mb-4">
          Relative to this project's own average — not a fixed universal threshold. Suggestions only; nothing is reassigned automatically.
        </p>

        {loadingWorkload ? (
          <Skeleton className="h-64 w-full" />
        ) : !workload || workload.members.length === 0 ? (
          <EmptyState title="No team members yet" description="Add team members to see workload distribution." />
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload.members} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E3346" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#8B90A8', fontSize: 12 }} axisLine={{ stroke: '#2E3346' }} tickLine={false} />
                  <YAxis tick={{ fill: '#8B90A8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#232739', border: '1px solid #2E3346', borderRadius: 12, fontSize: 13 }}
                    labelStyle={{ color: '#EDEFF7' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="pendingTasks" name="Pending tasks" radius={[6, 6, 0, 0]}>
                    {workload.members.map((m) => (
                      <Cell key={m.memberId} fill={WORKLOAD_COLORS[m.classification]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-xs text-ink2-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: WORKLOAD_COLORS.HIGH_WORKLOAD }} /> High workload</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: WORKLOAD_COLORS.BALANCED }} /> Balanced</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: WORKLOAD_COLORS.UNDERUTILIZED }} /> Underutilized</span>
              {workload.unassignedTaskCount > 0 && (
                <span className="ml-auto">{workload.unassignedTaskCount} task(s) unassigned</span>
              )}
            </div>

            {workload.recommendations?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-soft space-y-2">
                {workload.recommendations.map((r) => (
                  <p key={r.memberId} className="text-xs text-signal">{r.suggestion}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
