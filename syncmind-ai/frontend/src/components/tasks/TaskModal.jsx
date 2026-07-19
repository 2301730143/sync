import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import { projectService, taskService } from '../../services/projectService';
import { useConfirm } from '../common/Common';

const emptyForm = { title: '', description: '', ownerId: '', status: 'TODO', priority: 'MEDIUM', deadline: '', dependsOnTaskIds: [] };

export default function TaskModal({ open, onClose, task }) {
  const { projectId, members, tasks, refreshTasks, refreshOverview } = useProjectContext();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        ownerId: task.owner?.id || '',
        status: task.status,
        priority: task.priority,
        deadline: task.deadline ? task.deadline.slice(0, 10) : '',
        dependsOnTaskIds: task.dependsOn?.map((d) => d.id) || [],
      });
    } else {
      setForm(emptyForm);
    }
  }, [task, open]);

  if (!open) return null;

  const isEdit = !!task;
  const otherTasks = tasks.filter((t) => t.id !== task?.id);

  function buildPayload() {
    return {
      title: form.title,
      description: form.description || null,
      ownerId: form.ownerId || null,
      status: form.status,
      priority: form.priority,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      dependsOnTaskIds: form.dependsOnTaskIds,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        const { dependsOnTaskIds, ...rest } = buildPayload();
        await taskService.update(task.id, rest);
        toast.success('Task updated');
      } else {
        await projectService.createTask(projectId, buildPayload());
        toast.success('Task created');
      }
      await Promise.all([refreshTasks(), refreshOverview()]);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not save task');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    confirm({
      title: 'Delete this task?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await taskService.remove(task.id);
          toast.success('Task deleted');
          await Promise.all([refreshTasks(), refreshOverview()]);
          onClose();
        } catch (err) {
          toast.error(err.message || 'Could not delete task');
        }
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="card w-full max-w-lg p-6 animate-resolve max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">{isEdit ? 'Edit task' : 'New task'}</h3>
          {isEdit && (
            <button type="button" onClick={handleDelete} className="text-ink2-muted hover:text-alert p-1.5 rounded-lg hover:bg-alert-dim transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[70px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Owner</label>
              <select className="input" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>

          {!isEdit && otherTasks.length > 0 && (
            <div>
              <label className="label">Depends on</label>
              <select
                multiple
                className="input min-h-[80px]"
                value={form.dependsOnTaskIds}
                onChange={(e) => setForm({ ...form, dependsOnTaskIds: Array.from(e.target.selectedOptions, (o) => o.value) })}
              >
                {otherTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
      {dialog}
    </div>
  );
}
