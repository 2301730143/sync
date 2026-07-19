import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectOverview from './pages/ProjectOverview';
import Kanban from './pages/Kanban';
import Tasks from './pages/Tasks';
import Timeline from './pages/Timeline';
import Team from './pages/Team';
import Insights from './pages/Insights';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AppLayout from './layouts/AppLayout';
import ProjectLayout from './layouts/ProjectLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectOverview />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="team" element={<Team />} />
          <Route path="insights" element={<Insights />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
