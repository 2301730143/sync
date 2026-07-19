import { useState } from 'react';
import { initials } from '../../utils/format';

export function Avatar({ name, color = '#5B8DEF', size = 32 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-display font-semibold text-ink shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name) || '?'}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mb-4">
          <Icon size={22} className="text-ink2-muted" />
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-ink2-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-ink2-muted max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-surface-raised rounded-lg ${className}`} />;
}

export function StatCard({ label, value, icon: Icon, accent = 'signal' }) {
  const accentMap = {
    signal: 'text-signal bg-signal-dim',
    thread: 'text-thread bg-thread-dim',
    resolved: 'text-resolved bg-resolved-dim',
    alert: 'text-alert bg-alert-dim',
  };
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink2-muted mb-2">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink2-primary">{value}</p>
      </div>
      {Icon && (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentMap[accent]}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="card w-full max-w-sm p-6 animate-resolve" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-ink2-muted mb-6">{description}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState({ open: false });

  const confirm = ({ title, description, confirmLabel, danger, onConfirm }) => {
    setState({ open: true, title, description, confirmLabel, danger, onConfirm });
  };
  const close = () => setState({ open: false });

  const dialog = (
    <ConfirmDialog
      {...state}
      onCancel={close}
      onConfirm={async () => {
        await state.onConfirm?.();
        close();
      }}
    />
  );

  return { confirm, dialog };
}
