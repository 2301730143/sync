import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-signal flex items-center justify-center">
          <Radio size={16} className="text-ink" />
        </div>
        <span className="font-display font-semibold text-lg">SyncMind AI</span>
      </Link>

      <div className="card w-full max-w-sm p-7 animate-resolve">
        <h1 className="font-display text-xl font-semibold mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-ink2-muted mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
