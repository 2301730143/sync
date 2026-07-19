import { useMemo, useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { Avatar, EmptyState } from '../components/common/Common';
import TaskModal from '../components/tasks/TaskModal';
import { PRIORITY_META, STATUS_META } from '../utils/taskMeta';
import { deadlineLabel, isOverdue } from '../utils/format';

export default function Tasks() {
  const { tasks, members } = useProjectContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', ownerId: 'ALL' });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.status !== 'ALL' && t.status !== filters.status) return false;
      if (filters.ownerId !== 'ALL') {
        if (filters.ownerId === 'UNASSIGNED' && t.owner) return false;
        if (filters.ownerId !== 'UNASSIGNED' && t.owner?.id !== filters.ownerId) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  function openEdit(task) {
    setActiveTask(task);
    setModalOpen(true);
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <select className="input !w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="ALL">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select className="input !w-auto" value={filters.ownerId} onChange={(e) => setFilters({ ...filters, ownerId: e.target.value })}>
            <option value="ALL">All owners</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { setActiveTask(null); setModalOpen(true); }}>
          <Plus size={16} /> New task
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={ListChecks} title="No tasks match these filters" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink2-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border-soft last:border-0 hover:bg-surface-raised cursor-pointer transition-colors" onClick={() => openEdit(t)}>
                  <td className="px-4 py-3 font-medium text-ink2-primary">{t.title}</td>
                  <td className="px-4 py-3">
                    {t.owner ? (
                      <div className="flex items-center gap-2"><Avatar name={t.owner.name} size={22} /> {t.owner.name}</div>
                    ) : (
                      <span className="text-ink2-faint">Unassigned</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${STATUS_META[t.status]?.className}`}>{STATUS_META[t.status]?.label}</td>
                  <td className="px-4 py-3"><span className={`badge ${PRIORITY_META[t.priority]?.className}`}>{PRIORITY_META[t.priority]?.label}</span></td>
                  <td className={`px-4 py-3 ${isOverdue(t.deadline, t.status) ? 'text-alert font-medium' : 'text-ink2-muted'}`}>
                    {t.deadline ? deadlineLabel(t.deadline) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} task={activeTask} />
    </div>
  );
}
