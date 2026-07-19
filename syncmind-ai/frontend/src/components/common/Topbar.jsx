import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services/projectService';
import { formatRelative } from '../../utils/format';

export default function Topbar({ title, subtitle, actions }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    notificationService
      .list()
      .then((res) => setNotifications(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markRead(id) {
    await notificationService.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 sticky top-0 bg-ink/80 backdrop-blur z-10">
      <div>
        <h1 className="font-display text-lg font-semibold leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-ink2-muted mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-ink2-muted hover:text-ink2-primary transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-alert text-[10px] flex items-center justify-center text-white font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 card p-2 max-h-96 overflow-y-auto animate-resolve">
              <p className="px-3 py-2 text-xs uppercase tracking-wide text-ink2-faint font-medium">Notifications</p>
              {notifications.length === 0 && <p className="px-3 py-6 text-sm text-ink2-muted text-center">You're all caught up.</p>}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-colors ${
                    n.isRead ? 'text-ink2-muted hover:bg-surface-raised' : 'bg-surface-raised text-ink2-primary'
                  }`}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-ink2-muted mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-ink2-faint mt-1">{formatRelative(n.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
