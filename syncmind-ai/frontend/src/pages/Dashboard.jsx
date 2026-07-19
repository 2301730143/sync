import { useEffect, useState } from 'react';
import { Plus, FolderKanban, ListChecks, CheckCircle2, CalendarClock } from 'lucide-react';
import Topbar from '../components/common/Topbar';
import { StatCard, EmptyState, Skeleton } from '../components/common/Common';
import ProjectCard from '../components/dashboard/ProjectCard';
import NewProjectModal from '../components/dashboard/NewProjectModal';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { deadlineLabel } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await projectService.list();
      setProjects(res.data);
    } finally {
      setLoading(false);
    }
  }

  const totalTasks = projects.reduce((s, p) => s + p.totalTasks, 0);
  const completedTasks = projects.reduce((s, p) => s + p.completedTasks, 0);
  const upcoming = projects
    .filter((p) => p.upcomingDeadline)
    .sort((a, b) => new Date(a.upcomingDeadline) - new Date(b.upcomingDeadline))[0];

  return (
    <>
      <Topbar
        title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`}
        subtitle="Here's where things stand across your projects"
        actions={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New project
          </button>
        }
      />

      <div className="p-6 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active projects" value={projects.length} icon={FolderKanban} accent="signal" />
          <StatCard label="Total tasks" value={totalTasks} icon={ListChecks} accent="thread" />
          <StatCard label="Completed" value={completedTasks} icon={CheckCircle2} accent="resolved" />
          <StatCard
            label="Next deadline"
            value={upcoming ? deadlineLabel(upcoming.upcomingDeadline) : '—'}
            icon={CalendarClock}
            accent="alert"
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create a project, then paste in a conversation your team already had — SyncMind AI will turn it into tasks, owners, and deadlines."
              action={
                <button className="btn-primary" onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Create your first project
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(project) => {
          setModalOpen(false);
          setProjects((prev) => [project, ...prev]);
        }}
      />
    </>
  );
}
