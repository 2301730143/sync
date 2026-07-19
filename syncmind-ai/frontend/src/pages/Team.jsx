import { useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectContext } from '../context/ProjectContext';
import { Avatar, EmptyState, useConfirm } from '../components/common/Common';
import { projectService } from '../services/projectService';

export default function Team() {
  const { projectId, members, tasks, refreshMembers, refreshTasks } = useProjectContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'MEMBER' });
  const [submitting, setSubmitting] = useState(false);
  const { confirm, dialog } = useConfirm();

  function taskCounts(memberId) {
    const memberTasks = tasks.filter((t) => t.owner?.id === memberId);
    return {
      total: memberTasks.length,
      completed: memberTasks.filter((t) => t.status === 'COMPLETED').length,
    };
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await projectService.addMember(projectId, { name: form.name, email: form.email || null, role: form.role });
      toast.success('Team member added');
      setForm({ name: '', email: '', role: 'MEMBER' });
      setModalOpen(false);
      await refreshMembers();
    } catch (err) {
      toast.error(err.message || 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemove(member) {
    confirm({
      title: `Remove ${member.name}?`,
      description: 'Their assigned tasks will become unassigned.',
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: async () => {
        try {
          await projectService.removeMember(projectId, member.id);
          toast.success('Member removed');
          await Promise.all([refreshMembers(), refreshTasks()]);
        } catch (err) {
          toast.error(err.message || 'Could not remove member');
        }
      },
    });
  }

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add member</button>
      </div>

      {members.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No team members yet" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const counts = taskCounts(m.id);
            return (
              <div key={m.id} className="card p-4 flex items-center gap-3">
                <Avatar name={m.name} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-ink2-muted truncate">{m.email || 'No email'} · {m.role}</p>
                  <p className="text-xs text-ink2-faint mt-0.5">{counts.completed}/{counts.total} tasks completed</p>
                </div>
                {m.role !== 'OWNER' && (
                  <button onClick={() => handleRemove(m)} className="text-ink2-faint hover:text-alert p-1.5 rounded-lg hover:bg-alert-dim transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleAdd} className="card w-full max-w-sm p-6 animate-resolve" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold mb-4">Add team member</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add member'}</button>
            </div>
          </form>
        </div>
      )}
      {dialog}
    </div>
  );
}
