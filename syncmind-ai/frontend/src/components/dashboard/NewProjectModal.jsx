import { useState } from 'react';
import toast from 'react-hot-toast';
import { projectService } from '../../services/projectService';

export default function NewProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await projectService.create(form);
      toast.success('Project created');
      onCreated(res.data);
      setForm({ name: '', description: '' });
    } catch (err) {
      toast.error(err.message || 'Could not create project');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 animate-resolve" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-semibold mb-4">New project</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Project name</label>
            <input
              required
              autoFocus
              className="input"
              placeholder="e.g. Final Year Project — Smart Attendance"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input min-h-[90px] resize-none"
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating...' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
}
