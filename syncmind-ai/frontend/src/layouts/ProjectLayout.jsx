import { Outlet } from 'react-router-dom';
import { ProjectProvider, useProjectContext } from '../context/ProjectContext';
import Topbar from '../components/common/Topbar';
import { Skeleton } from '../components/common/Common';
import { HEALTH_META } from '../utils/taskMeta';

function ProjectShell() {
  const { project, loading, error } = useProjectContext();

  if (error) {
    return (
      <div className="p-8">
        <p className="text-alert text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Topbar
        title={loading ? '...' : project?.name}
        subtitle={loading ? undefined : `${project?.teamSize ?? 0} members · ${project?.totalTasks ?? 0} tasks`}
        actions={
          !loading &&
          project && (
            <span className={`badge ${HEALTH_META[project.health]?.className}`}>{HEALTH_META[project.health]?.label}</span>
          )
        }
      />
      {loading ? (
        <div className="p-6 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
}

export default function ProjectLayout() {
  return (
    <ProjectProvider>
      <ProjectShell />
    </ProjectProvider>
  );
}
