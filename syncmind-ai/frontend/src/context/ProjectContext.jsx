import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/projectService';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshOverview = useCallback(async () => {
    const res = await projectService.overview(projectId);
    setProject(res.data);
    return res.data;
  }, [projectId]);

  const refreshMembers = useCallback(async () => {
    const res = await projectService.listMembers(projectId);
    setMembers(res.data);
    return res.data;
  }, [projectId]);

  const refreshTasks = useCallback(async () => {
    const res = await projectService.listTasks(projectId);
    setTasks(res.data);
    return res.data;
  }, [projectId]);

  const refreshConversations = useCallback(async () => {
    const res = await projectService.listConversations(projectId);
    setConversations(res.data);
    return res.data;
  }, [projectId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshOverview(), refreshMembers(), refreshTasks(), refreshConversations()]);
  }, [refreshOverview, refreshMembers, refreshTasks, refreshConversations]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([refreshOverview(), refreshMembers(), refreshTasks(), refreshConversations()])
      .catch((err) => !cancelled && setError(err.message || 'Failed to load project'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        project,
        members,
        tasks,
        conversations,
        loading,
        error,
        refreshOverview,
        refreshMembers,
        refreshTasks,
        refreshConversations,
        refreshAll,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider');
  return ctx;
}
