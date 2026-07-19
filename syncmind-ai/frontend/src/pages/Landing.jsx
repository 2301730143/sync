import { Link } from 'react-router-dom';
import {
  Radio,
  ArrowRight,
  MessageSquareText,
  KanbanSquare,
  Sparkles,
  Users,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: MessageSquareText,
    title: 'Paste any conversation',
    text: 'WhatsApp, Discord, Slack, Teams, or plain meeting notes — drop in the raw thread, no reformatting.',
  },
  {
    icon: Sparkles,
    title: 'AI extracts the structure',
    text: 'Tasks, owners, deadlines, priorities, decisions, and dependencies — pulled out and reviewed before anything is created.',
  },
  {
    icon: KanbanSquare,
    title: 'Workspace, generated',
    text: 'Kanban board, timeline, and task list appear instantly. Drag, edit, and reassign like any project tool.',
  },
  {
    icon: Users,
    title: 'Workload, balanced',
    text: 'See who is overloaded and who has room, based on your team\'s own numbers — never a generic threshold.',
  },
  {
    icon: CalendarClock,
    title: 'Risk, flagged early',
    text: 'Overdue tasks, missing owners, and blocked dependencies surface automatically as AI insights.',
  },
  {
    icon: ShieldCheck,
    title: 'Conversation stays data',
    text: 'Imported text is never treated as instructions — only ever mined for project information.',
  },
];

const STEPS = [
  { label: 'Import', text: 'Paste or upload the conversation your team already had.' },
  { label: 'Review', text: 'AI proposes tasks, owners, and deadlines. You edit anything before confirming.' },
  { label: 'Coordinate', text: 'Kanban, timeline, and workload views build themselves — stay in one place from here.' },
];

const AUDIENCE = ['College teams', 'Hackathon squads', 'Final-year projects', 'Startup pods', 'Remote dev teams'];

// Signature element: a horizontal strip of raw chat lines that visually
// "resolve" into clean task cards — the literal transformation the product performs.
function TransformStrip() {
  const rawLines = [
    'rahul: ok i can take the login page',
    'priya: someone needs to finish the db schema by fri',
    'arjun: ill review PRs after my exam tues',
    'rahul: don\'t forget the demo deck too',
  ];
  const resolved = [
    { title: 'Build login page', owner: 'Rahul', tag: 'MEDIUM' },
    { title: 'Finish DB schema', owner: 'Unassigned', tag: 'HIGH' },
    { title: 'Review PRs', owner: 'Arjun', tag: 'LOW' },
  ];

  return (
    <div className="relative grid md:grid-cols-[1fr_auto_1fr] gap-5 items-center w-full">
      <div className="card p-5 font-mono text-[13px] leading-relaxed text-ink2-muted space-y-1.5">
        <p className="text-[11px] uppercase tracking-wide text-ink2-faint mb-2 font-sans">#project-chat</p>
        {rawLines.map((l, i) => (
          <p key={i} className="opacity-90">{l}</p>
        ))}
      </div>

      <div className="flex md:flex-col items-center justify-center gap-1 text-signal">
        <ArrowRight size={20} className="hidden md:block" />
        <ArrowRight size={20} className="md:hidden rotate-90" />
        <span className="text-[10px] uppercase tracking-widest text-ink2-faint">Signal</span>
      </div>

      <div className="grid gap-2.5">
        {resolved.map((t, i) => (
          <div
            key={t.title}
            className="card p-3.5 flex items-center justify-between animate-resolve"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div>
              <p className="text-sm font-medium text-ink2-primary">{t.title}</p>
              <p className="text-xs text-ink2-muted mt-0.5">{t.owner}</p>
            </div>
            <span className={`badge ${t.tag === 'HIGH' ? 'bg-signal-dim text-signal border border-signal/30' : t.tag === 'MEDIUM' ? 'bg-thread-dim text-thread border border-thread/30' : 'bg-surface-raised text-ink2-muted border border-border'}`}>
              {t.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-signal flex items-center justify-center">
              <Radio size={16} className="text-ink" />
            </div>
            <span className="font-display font-semibold text-lg">SyncMind AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/register" className="btn-primary">Sign up free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-signal bg-signal-dim border border-signal/30 rounded-full px-3 py-1 mb-6">
            <Sparkles size={12} /> AI project coordinator
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] mb-6">
            Turn Conversations<br />Into Action
          </h1>
          <p className="text-lg text-ink2-muted mb-8 max-w-xl">
            Your team already decided who's doing what — it's just buried in a chat thread. SyncMind AI reads it once and builds the project workspace for you.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/register" className="btn-primary text-base px-5 py-3">
              Start free <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-5 py-3">Log in</Link>
          </div>
        </div>
      </section>

      {/* Signature transform strip */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <TransformStrip />
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-10">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.label} className="relative">
              <p className="font-mono text-xs text-signal mb-3">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="font-display text-lg font-semibold mb-2">{s.label}</h3>
              <p className="text-sm text-ink2-muted leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-10">Everything the workflow needs</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center mb-4">
                <f.icon size={17} className="text-signal" />
              </div>
              <h3 className="font-medium text-sm mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink2-muted leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audience */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <p className="text-xs uppercase tracking-wide text-ink2-faint mb-4">Built for</p>
        <div className="flex flex-wrap gap-2.5">
          {AUDIENCE.map((a) => (
            <span key={a} className="badge bg-surface-raised border border-border text-ink2-muted">{a}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border text-center">
        <h2 className="font-display text-3xl font-semibold mb-4">Stop retyping what your team already said.</h2>
        <Link to="/register" className="btn-primary text-base px-6 py-3 inline-flex">
          Create your first project <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-ink2-faint">
          <span>SyncMind AI</span>
          <span>Built for teams who talk first, plan later.</span>
        </div>
      </footer>
    </div>
  );
}
