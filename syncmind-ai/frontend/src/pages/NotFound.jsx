import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mb-5">
        <Radio size={22} className="text-ink2-muted" />
      </div>
      <h1 className="font-display text-2xl font-semibold mb-2">Lost signal</h1>
      <p className="text-sm text-ink2-muted max-w-sm mb-6">
        This page doesn't exist, or the link is out of date. Head back and we'll get you to the right workspace.
      </p>
      <Link to="/dashboard" className="btn-primary">Back to dashboard</Link>
    </div>
  );
}
