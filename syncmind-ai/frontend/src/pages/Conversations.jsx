import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquareText, Sparkles, Upload, X, Check, Trash2 } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { projectService } from '../services/projectService';
import { EmptyState } from '../components/common/Common';
import { formatRelative } from '../utils/format';

const SOURCES = [
  { value: 'PASTE', label: 'Pasted text' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'DISCORD', label: 'Discord' },
  { value: 'SLACK', label: 'Slack' },
  { value: 'TEAMS', label: 'Microsoft Teams' },
  { value: 'NOTES', label: 'Meeting notes' },
];

const MAX_CHARS = 50000;

export default function Conversations() {
  const { projectId, members, conversations, refreshConversations, refreshAll } = useProjectContext();
  const [text, setText] = useState('');
  const [source, setSource] = useState('PASTE');
  const [fileName, setFileName] = useState(null);
  const [importing, setImporting] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [analysis, setAnalysis] = useState(null); // { analysisId, isMock, tasks, decisions, actionItems, projectRisks }
  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) {
      toast.error('Only .txt files are supported in this MVP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File is too large (max 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result).slice(0, MAX_CHARS));
      setFileName(file.name);
      setSource('UPLOAD');
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (text.trim().length < 20) {
      toast.error('Paste at least a few lines of conversation first');
      return;
    }
    setImporting(true);
    try {
      const res = await projectService.importConversation(projectId, { rawText: text, source, fileName });
      toast.success('Conversation imported');
      setActiveConversationId(res.data.id);
      await refreshConversations();
      await handleAnalyze(res.data.id);
    } catch (err) {
      toast.error(err.message || 'Could not import conversation');
    } finally {
      setImporting(false);
    }
  }

  async function handleAnalyze(conversationId) {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await projectService.analyze(projectId, conversationId);
      setAnalysis(res.data);
      if (res.data.isMock) {
        toast('Running in AI mock mode — set GEMINI_API_KEY on the server for real extraction.', { icon: '⚠️' });
      }
    } catch (err) {
      toast.error(err.message || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  function updateDraftTask(index, patch) {
    setAnalysis((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }

  function removeDraftTask(index) {
    setAnalysis((prev) => ({ ...prev, tasks: prev.tasks.filter((_, i) => i !== index) }));
  }

  async function handleConfirm() {
    if (!analysis) return;
    setConfirming(true);
    try {
      const res = await projectService.confirmAnalysis(projectId, analysis.analysisId, {
        tasks: analysis.tasks,
        decisions: analysis.decisions,
      });
      toast.success(`${res.data.generated} task(s) added to your project`);
      setAnalysis(null);
      setText('');
      setFileName(null);
      await refreshAll();
    } catch (err) {
      toast.error(err.message || 'Could not confirm analysis');
    } finally {
      setConfirming(false);
    }
  }

  async function handleDiscard() {
    if (!analysis) return;
    try {
      await projectService.discardAnalysis(projectId, analysis.analysisId);
      setAnalysis(null);
    } catch (err) {
      toast.error(err.message || 'Could not discard analysis');
    }
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {!analysis && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <MessageSquareText size={17} className="text-thread" /> Import a conversation
            </h3>
            <select className="input !w-auto" value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <textarea
            className="input min-h-[220px] font-mono text-[13px] resize-y"
            placeholder={'Paste your conversation here, e.g.\n\nrahul: ok i can take the login page\npriya: someone needs to finish the db schema by fri\narjun: ill review PRs after my exam tues'}
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => {
              setText(e.target.value);
              setFileName(null);
            }}
          />
          <div className="flex items-center justify-between mt-2 mb-4">
            <label className="btn-ghost cursor-pointer !px-2 !py-1">
              <Upload size={14} /> Upload .txt file
              <input type="file" accept=".txt" className="hidden" onChange={handleFile} />
            </label>
            <span className="text-xs text-ink2-faint">
              {fileName && <span className="mr-2">{fileName}</span>}
              {text.length}/{MAX_CHARS}
            </span>
          </div>

          <div className="bg-thread-dim border border-thread/20 rounded-xl px-4 py-3 text-xs text-thread mb-4 flex items-start gap-2">
            <Sparkles size={14} className="shrink-0 mt-0.5" />
            <span>Imported text is treated as data only — AI never follows instructions found inside a conversation, only extracts project information from it.</span>
          </div>

          <button className="btn-primary w-full" disabled={importing || analyzing} onClick={handleImport}>
            {importing || analyzing ? 'Analyzing with AI...' : 'Import & analyze'}
          </button>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Sparkles size={17} className="text-signal" /> Review extracted tasks
            </h3>
            {analysis.isMock && (
              <span className="badge bg-signal-dim text-signal border border-signal/30">Mock AI mode</span>
            )}
          </div>
          <p className="text-sm text-ink2-muted -mt-2">
            Nothing is added to your project yet. Edit anything below, then confirm.
          </p>

          {analysis.tasks.length === 0 ? (
            <div className="card"><EmptyState icon={Sparkles} title="No tasks were detected" description="Try importing a more detailed conversation, or add tasks manually from the Kanban board." /></div>
          ) : (
            <div className="space-y-3">
              {analysis.tasks.map((t, i) => (
                <div key={i} className="card p-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
                  <div className="space-y-2">
                    <input
                      className="input font-medium"
                      value={t.title}
                      onChange={(e) => updateDraftTask(i, { title: e.target.value })}
                    />
                    {t.description && <p className="text-xs text-ink2-muted px-1">{t.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      <select className="input !w-auto !py-1.5 text-xs" value={t.priority} onChange={(e) => updateDraftTask(i, { priority: e.target.value })}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                      <input
                        className="input !w-auto !py-1.5 text-xs"
                        placeholder="Owner (name)"
                        value={t.owner || ''}
                        onChange={(e) => updateDraftTask(i, { owner: e.target.value || null })}
                        list="member-names"
                      />
                      <input
                        type="date"
                        className="input !w-auto !py-1.5 text-xs"
                        value={t.deadline ? t.deadline.slice(0, 10) : ''}
                        onChange={(e) => updateDraftTask(i, { deadline: e.target.value || null })}
                      />
                      <span className="text-xs text-ink2-faint self-center">
                        Confidence: {Math.round((t.confidence ?? 0.6) * 100)}%
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeDraftTask(i)} className="text-ink2-faint hover:text-alert p-1.5 rounded-lg hover:bg-alert-dim transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <datalist id="member-names">
                {members.map((m) => <option key={m.id} value={m.name} />)}
              </datalist>
            </div>
          )}

          {analysis.decisions?.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-medium mb-2">Decisions detected</h4>
              <ul className="text-sm text-ink2-muted space-y-1 list-disc pl-4">
                {analysis.decisions.map((d, i) => <li key={i}>{d.summary}</li>)}
              </ul>
            </div>
          )}

          {analysis.projectRisks?.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-medium mb-2">Flagged by AI</h4>
              <ul className="text-sm text-ink2-muted space-y-1 list-disc pl-4">
                {analysis.projectRisks.map((r, i) => <li key={i}>{r.description}</li>)}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={handleDiscard}>
              <X size={15} /> Discard
            </button>
            <button className="btn-primary" disabled={confirming} onClick={handleConfirm}>
              <Check size={15} /> {confirming ? 'Generating...' : `Confirm & generate ${analysis.tasks.length} task(s)`}
            </button>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs uppercase tracking-wide text-ink2-faint font-medium mb-3">Past imports</h4>
        {conversations.length === 0 ? (
          <p className="text-sm text-ink2-muted">No conversations imported yet.</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <div key={c.id} className="card p-3.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.fileName || `${c.source} import`}</p>
                  <p className="text-xs text-ink2-faint">{formatRelative(c.createdAt)} · {c.rawText.length} characters</p>
                </div>
                <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => { setActiveConversationId(c.id); handleAnalyze(c.id); }}>
                  Re-analyze
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
