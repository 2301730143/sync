import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Trash2, Mail } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { projectService } from '../services/projectService';
import { useConfirm } from '../components/common/Common';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { projectId, project, refreshOverview } = useProjectContext();
  const { user, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const { confirm, dialog } = useConfirm();

  async function handleToggleEmail() {
    setSavingPrefs(true);
    try {
      await updatePreferences({ emailNotificationsEnabled: !user.emailNotificationsEnabled });
      toast.success(user.emailNotificationsEnabled ? 'Email notifications turned off' : 'Email notifications turned on');
    } catch (err) {
      toast.error(err.message || 'Could not update preference');
    } finally {
      setSavingPrefs(false);
    }
  }

  useEffect(() => {
    if (project) setForm({ name: project.name, description: project.description || '' });
  }, [project]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await projectService.update(projectId, form);
      await refreshOverview();
      toast.success('Project updated');
    } catch (err) {
      toast.error(err.message || 'Could not update project');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    confirm({
      title: 'Delete this project?',
      description: 'This permanently deletes all tasks, conversations, and insights. This cannot be undone.',
      confirmLabel: 'Delete project',
      danger: true,
      onConfirm: async () => {
        try {
          await projectService.remove(projectId);
          toast.success('Project deleted');
          navigate('/dashboard');
        } catch (err) {
          toast.error(err.message || 'Could not delete project');
        }
      },
    });
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="card p-5">
        <h3 className="font-display font-semibold flex items-center gap-2 mb-1">
          <Mail size={17} className="text-ink2-muted" /> Email notifications
        </h3>
        <p className="text-sm text-ink2-muted mb-4">
          Applies to your account across every project — deadline alerts, AI risk warnings, and project activity.
        </p>
        <button
          type="button"
          onClick={handleToggleEmail}
          disabled={savingPrefs || !user}
          className="flex items-center justify-between w-full bg-surface-raised border border-border rounded-xl px-4 py-3 disabled:opacity-50"
        >
          <span className="text-sm">
            {user?.emailNotificationsEnabled ? 'On — you\u2019ll get emails for important updates' : 'Off — in-app notifications only'}
          </span>
          <span
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              user?.emailNotificationsEnabled ? 'bg-signal' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-ink transition-transform ${
                user?.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </span>
        </button>
      </div>

      <form onSubmit={handleSave} className="card p-5">
        <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
          <SettingsIcon size={17} className="text-ink2-muted" /> Project settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="label">Project name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[90px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>

      <div className="card p-5 border-alert/20">
        <h3 className="font-display font-semibold text-alert mb-1">Danger zone</h3>
        <p className="text-sm text-ink2-muted mb-4">Deleting a project removes all of its tasks, conversations, and insights permanently.</p>
        <button className="btn-danger" onClick={handleDelete}>
          <Trash2 size={15} /> Delete this project
        </button>
      </div>

      {dialog}
    </div>
  );
}
