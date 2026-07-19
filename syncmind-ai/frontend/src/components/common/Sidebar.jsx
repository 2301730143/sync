import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  ListChecks,
  CalendarDays,
  Users,
  Sparkles,
  MessageSquareText,
  Settings,
  Radio,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from './Common';

const projectNav = [
  { to: '', end: true, icon: LayoutDashboard, label: 'Overview' },
  { to: 'kanban', icon: KanbanSquare, label: 'Kanban' },
  { to: 'tasks', icon: ListChecks, label: 'Tasks' },
  { to: 'timeline', icon: CalendarDays, label: 'Timeline' },
  { to: 'team', icon: Users, label: 'Team' },
  { to: 'insights', icon: Sparkles, label: 'AI Insights' },
  { to: 'conversations', icon: MessageSquareText, label: 'Conversations' },
  { to: 'settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { projectId } = useParams();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-ink-soft border-r border-border flex flex-col">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-signal flex items-center justify-center">
          <Radio size={15} className="text-ink" />
        </div>
        <span className="font-display font-semibold text-[15px]">SyncMind AI</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
              isActive ? 'bg-surface-raised text-ink2-primary' : 'text-ink2-muted hover:bg-surface-raised hover:text-ink2-primary'
            }`
          }
        >
          <LayoutDashboard size={17} />
          All Projects
        </NavLink>

        {projectId && (
          <>
            <p className="px-3 mt-5 mb-2 text-[11px] uppercase tracking-wide text-ink2-faint font-medium">Workspace</p>
            {projectNav.map((item) => (
              <NavLink
                key={item.label}
                to={`/projects/${projectId}/${item.to}`}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
                    isActive ? 'bg-signal-dim text-signal' : 'text-ink2-muted hover:bg-surface-raised hover:text-ink2-primary'
                  }`
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar name={user?.name} color={user?.avatarColor} size={30} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-ink2-muted truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-ink2-muted hover:text-alert p-1.5 rounded-lg hover:bg-alert-dim transition-colors" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
