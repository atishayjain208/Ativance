import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getDSAProgress, updateDSAProgress, analyzeDSA, syncLeetcodeStats } from '../services/authService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants — mirrors backend TOPIC_BASELINES for the form
// ─────────────────────────────────────────────────────────────────────────────
const TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Binary Search', 'Linked Lists', 'Stacks', 'Queues', 'Trees',
  'Graphs', 'Recursion', 'Backtracking', 'Dynamic Programming',
  'Greedy', 'Heap', 'Trie',
];

const DIFF_META = {
  easy:   { label: 'Easy',   colour: '#10B981', bg: 'bg-emerald-50/60', border: 'border-emerald-200/80', text: 'text-emerald-700', barBg: '#10B981' },
  medium: { label: 'Medium', colour: '#F59E0B', bg: 'bg-amber-50/60',   border: 'border-amber-200/80',   text: 'text-amber-700',   barBg: '#F59E0B' },
  hard:   { label: 'Hard',   colour: '#EF4444', bg: 'bg-rose-50/60',    border: 'border-rose-200/80',    text: 'text-rose-700',    barBg: '#EF4444' },
};

const BAR_PALETTE = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9',
  '#8B5CF6', '#F97316', '#14B8A6', '#EC4899', '#06B6D4',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const buildTopicMap = (arr = []) => {
  const map = {};
  for (const { topic, count } of arr) map[topic] = count;
  return map;
};

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty card
// ─────────────────────────────────────────────────────────────────────────────
function DiffCard({ tier, count, total }) {
  const m   = DIFF_META[tier];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={`flex-1 min-w-[120px] rounded-2xl border ${m.bg} ${m.border} p-4 flex flex-col gap-1.5 shadow-soft`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${m.text}`}>{m.label}</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">{count}</p>
      <div className="h-2 w-full rounded-full bg-zinc-200/80 overflow-hidden mt-1">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.barBg }} />
      </div>
      <p className="text-[11px] font-medium text-zinc-500">{pct}% of total problems</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom tooltip for topic chart
// ─────────────────────────────────────────────────────────────────────────────
function TopicTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs text-zinc-900 shadow-card">
      <p className="font-bold">{payload[0].payload.topic}</p>
      <p className="text-zinc-500">{payload[0].value} problems solved</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty badge used inside problem list
// ─────────────────────────────────────────────────────────────────────────────
function DiffBadge({ difficulty }) {
  const styles = {
    Easy:   'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    Medium: 'bg-amber-50   text-amber-700   border-amber-200/80',
    Hard:   'bg-rose-50    text-rose-700    border-rose-200/80',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${styles[difficulty] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
      {difficulty}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus area card — one weak topic + its recommended problems
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the best link href for a problem:
 *   1. If a non-empty slug exists → canonical LeetCode problem URL
 *   2. Otherwise → LeetCode problem-set search URL
 */
function problemHref(p) {
  if (p.slug && p.slug.trim()) {
    return `https://leetcode.com/problems/${p.slug.trim()}/`;
  }
  return `https://leetcode.com/problemset/?search=${encodeURIComponent(p.title)}`;
}

/**
 * Returns a search-based fallback URL (used via onerror / manual fallback).
 */
function problemFallback(title) {
  return `https://leetcode.com/problemset/?search=${encodeURIComponent(title)}`;
}

function FocusCard({ detail, problems }) {
  const [open, setOpen] = useState(true);
  const pct = Math.round((detail.count / detail.threshold) * 100);

  return (
    <div className="bg-white border border-[#E5E5E0] rounded-2xl overflow-hidden shadow-soft transition-all">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-zinc-50/70 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-rose-500 text-lg">⚠️</span>
          <div className="text-left min-w-0">
            <p className="font-bold text-zinc-900 text-sm">{detail.topic}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {detail.count}/{detail.threshold} solved · {detail.gap} more needed for solid level
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Mini progress ring */}
          <div className="relative h-9 w-9">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg] h-9 w-9">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E5E0" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#EF4444" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-900">
              {pct}%
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Problem list */}
      {open && (
        <div className="border-t border-zinc-100 px-5 py-4 space-y-2 bg-zinc-50/40">
          {problems.length === 0 ? (
            <p className="text-xs text-zinc-500">No practice problem recommendations available yet.</p>
          ) : (
            <ul className="space-y-2">
              {problems.map((p, i) => (
                <li key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white border border-zinc-200/60 shadow-soft">
                  <span className="text-zinc-400 text-xs w-5 shrink-0 text-right font-medium">{i + 1}.</span>
                  <a
                    href={problemHref(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-semibold text-indigo-700 hover:text-indigo-900 hover:underline flex-1 leading-snug transition-colors"
                  >
                    {p.title}
                  </a>
                  <DiffBadge difficulty={p.difficulty} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Update form
// ─────────────────────────────────────────────────────────────────────────────
function UpdateForm({ initial, onSaved }) {
  const [diff, setDiff]     = useState(initial.diff);
  const [topics, setTopics] = useState(initial.topics);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [saved, setSaved]   = useState(false);

  const setTopic = (name, val) =>
    setTopics((prev) => ({ ...prev, [name]: Math.max(0, Number(val) || 0) }));

  const setDiffVal = (key, val) =>
    setDiff((prev) => ({ ...prev, [key]: Math.max(0, Number(val) || 0) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload = {
        solvedByDifficulty: diff,
        solvedByTopic: TOPICS.map((t) => ({ topic: t, count: topics[t] ?? 0 })),
      };
      const data = await updateDSAProgress(payload);
      onSaved(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Difficulty counts */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">Solved by difficulty</p>
        <div className="grid grid-cols-3 gap-3">
          {['easy', 'medium', 'hard'].map((tier) => {
            const m = DIFF_META[tier];
            return (
              <div key={tier} className={`rounded-2xl border ${m.bg} ${m.border} p-3.5 space-y-1.5 shadow-soft`}>
                <label className={`block text-xs font-bold uppercase tracking-wider ${m.text}`}>{m.label}</label>
                <input
                  type="number" min="0"
                  value={diff[tier]}
                  onChange={(e) => setDiffVal(tier, e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-sm text-zinc-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-soft"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic counts */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">Solved by topic category</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TOPICS.map((topic) => (
            <div key={topic} className="bg-white border border-zinc-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-soft">
              <label className="text-xs font-medium text-zinc-700 truncate flex-1">{topic}</label>
              <input
                type="number" min="0"
                value={topics[topic] ?? 0}
                onChange={(e) => setTopic(topic, e.target.value)}
                className="w-14 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl px-3.5 py-2.5">{error}</p>
      )}

      <button
        type="submit" disabled={saving}
        className="w-full py-3 bg-[#171717] hover:bg-black disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span>Saving changes…</span>
          </>
        ) : saved ? (
          <span className="text-emerald-400">✓ Progress saved successfully!</span>
        ) : 'Save DSA Counts'}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function DSACoach() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [progress, setProgress]           = useState(null);
  const [totalSolved, setTotalSolved]     = useState(0);
  const [weakDetails, setWeakDetails]     = useState([]);   // [{topic,count,threshold,gap}]
  const [problems, setProblems]           = useState([]);   // [{title,difficulty,topic}]
  const [analysisAt, setAnalysisAt]       = useState(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading]             = useState(true);
  const [analyzing, setAnalyzing]         = useState(false);
  const [fetchError, setFetchError]       = useState('');
  const [analyzeError, setAnalyzeError]   = useState('');
  const [showForm, setShowForm]           = useState(false);

  // ── LeetCode Sync State ─────────────────────────────────────────────────────
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [syncing, setSyncing]                   = useState(false);
  const [syncError, setSyncError]               = useState('');
  const [syncSuccess, setSyncSuccess]           = useState('');

  // ── Load on mount ───────────────────────────────────────────────────────────
  useEffect(() => { fetchProgress(); }, []);

  const fetchProgress = async () => {
    setLoading(true); setFetchError('');
    try {
      const data = await getDSAProgress();
      applyProgress(data);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load progress.');
    } finally {
      setLoading(false);
    }
  };

  const applyProgress = (data) => {
    setProgress(data.progress);
    setTotalSolved(data.totalSolved ?? 0);
    if (data.progress) {
      setLeetcodeUsername(data.progress.leetcodeUsername || '');
      // Restore previously stored analysis if any
      if (data.progress.weakTopics?.length) {
        // Reconstruct weakDetails from stored weak topics + solvedByTopic
        const topicMap = buildTopicMap(data.progress.solvedByTopic);
        setWeakDetails(
          (data.progress.weakTopics || []).map((t) => ({
            topic:     t,
            count:     topicMap[t] ?? 0,
            threshold: 8, // baseline approximation for display
            gap:       Math.max(0, 8 - (topicMap[t] ?? 0)),
          }))
        );
      }
      if (data.progress.recommendedProblems?.length) {
        setProblems(data.progress.recommendedProblems);
      }
      if (data.progress.analysisGeneratedAt) {
        setAnalysisAt(data.progress.analysisGeneratedAt);
      }
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true); setAnalyzeError('');
    try {
      const data = await analyzeDSA();
      setWeakDetails(data.weakTopicDetails ?? []);
      setProblems(data.recommendedProblems ?? []);
      setAnalysisAt(data.analysisGeneratedAt);
    } catch (err) {
      setAnalyzeError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaved = (data) => {
    setProgress(data.progress);
    setTotalSolved(data.totalSolved ?? 0);
    // Clear stale analysis after counts change
    setWeakDetails([]); setProblems([]); setAnalysisAt(null);
    setShowForm(false);
  };

  const handleSync = async (e) => {
    e.preventDefault();
    if (!leetcodeUsername.trim() || syncing) return;

    setSyncing(true); setSyncError(''); setSyncSuccess('');
    try {
      const data = await syncLeetcodeStats(leetcodeUsername);
      applyProgress(data);
      // Clear stale analysis after counts change
      setWeakDetails([]); setProblems([]); setAnalysisAt(null);
      setSyncSuccess(data.message || 'Synced successfully!');
      setTimeout(() => setSyncSuccess(''), 4000);
    } catch (err) {
      setSyncError(err.response?.data?.message || 'Failed to sync with LeetCode. Verify username is public.');
    } finally {
      setSyncing(false);
    }
  };

  // ── Derived chart data ──────────────────────────────────────────────────────
  const topicChartData = (progress?.solvedByTopic ?? [])
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((e) => ({ topic: e.topic, count: e.count }));

  const diff = progress?.solvedByDifficulty ?? { easy: 0, medium: 0, hard: 0 };

  // ── Initial form values ─────────────────────────────────────────────────────
  const topicMap   = buildTopicMap(progress?.solvedByTopic);
  const initTopics = Object.fromEntries(TOPICS.map((t) => [t, topicMap[t] ?? 0]));

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-xs font-semibold text-zinc-500">Loading your DSA coach profile…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-xl mx-auto mt-10 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium shadow-soft">
        {fetchError}
        <button onClick={fetchProgress} className="ml-3 underline font-bold text-indigo-600">Retry</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">DSA Coach</h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Track problem-solving milestones, identify topic gaps, and practice AI-curated question sets.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="shrink-0 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E5E0] bg-white hover:bg-zinc-50 text-zinc-700 transition-all shadow-soft"
        >
          {showForm ? '✕ Close Panel' : '✏️ Update Progress'}
        </button>
      </div>

      {/* ── No data banner ── */}
      {!progress && (
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl px-5 py-4 text-xs sm:text-sm text-indigo-900 flex items-start gap-3 shadow-soft">
          <span className="text-xl mt-0.5">💡</span>
          <p>
            You have not logged any DSA progress yet. Sync your <strong>LeetCode username</strong> or enter your counts manually to begin.
          </p>
        </div>
      )}

      {/* ── Update form panel ── */}
      {showForm && (
        <div className="space-y-4 animate-fadeIn">
          {/* LeetCode Sync Bar */}
          <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 space-y-4 shadow-soft">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">🔗 Auto-Sync from LeetCode</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Import problem-solving counts directly from your public LeetCode profile.
              </p>
            </div>

            <form onSubmit={handleSync} className="flex gap-3 max-w-md items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="leetcode-username" className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">LeetCode Username</label>
                <input
                  id="leetcode-username"
                  type="text"
                  value={leetcodeUsername}
                  onChange={(e) => {
                    setLeetcodeUsername(e.target.value);
                    setSyncError('');
                    setSyncSuccess('');
                  }}
                  placeholder="e.g. lee215"
                  className="w-full bg-white border border-[#E5E5E0] rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-zinc-400 shadow-soft"
                />
              </div>
              <button
                type="submit"
                disabled={syncing || !leetcodeUsername.trim()}
                className="px-5 py-2.5 bg-[#171717] hover:bg-black disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 h-[40px] min-w-[110px] shadow-sm"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <span>Syncing…</span>
                  </>
                ) : 'Sync Profile'}
              </button>
            </form>

            {syncError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200/80 px-4 py-3 rounded-xl space-y-1.5">
                <p>{syncError}</p>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('manual-entry-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold underline block text-left"
                >
                  Enter stats manually instead →
                </button>
              </div>
            )}
            {syncSuccess && (
              <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-4 py-3 rounded-xl">{syncSuccess}</p>
            )}

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              ⚠️ LeetCode stats are fetched via an unofficial endpoint. Syncing depends on LeetCode's public servers and profile privacy settings.
            </p>
          </div>

          {/* Manual Entry Form */}
          <div id="manual-entry-section" className="bg-white border border-[#E5E5E0] rounded-2xl p-6 shadow-soft space-y-4">
            <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">✏️ Manual Entry Fallback</h2>
            <UpdateForm
              initial={{ diff: { easy: diff.easy, medium: diff.medium, hard: diff.hard }, topics: initTopics }}
              onSaved={handleSaved}
            />
          </div>
        </div>
      )}

      {progress && (
        <>
          {/* ── Difficulty stat cards ── */}
          <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 space-y-4 shadow-soft">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Total Questions Solved</h2>
                {progress?.dataSource === 'leetcode-auto' ? (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-full px-2.5 py-0.5">
                    Auto-synced from LeetCode ({progress?.leetcodeUsername || 'profile'})
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-full px-2.5 py-0.5">
                    Manually Entered
                  </span>
                )}
              </div>
              <span className="text-2xl font-black text-zinc-900 tracking-tight">{totalSolved}</span>
            </div>
            <div className="flex gap-3.5 flex-wrap">
              {['easy', 'medium', 'hard'].map((tier) => (
                <DiffCard key={tier} tier={tier} count={diff[tier] ?? 0} total={totalSolved} />
              ))}
            </div>
          </div>

          {/* ── Topic bar chart ── */}
          {topicChartData.length > 0 && (
            <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 space-y-4 shadow-soft">
              <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Topic-wise Distribution</h2>
              <ResponsiveContainer width="100%" height={Math.max(200, topicChartData.length * 36)}>
                <BarChart data={topicChartData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                  <XAxis
                    type="number"
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={{ stroke: '#E5E5E0' }} tickLine={false}
                  />
                  <YAxis
                    type="category" dataKey="topic" width={120}
                    tick={{ fill: '#27272A', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#E5E5E0' }} tickLine={false}
                  />
                  <Tooltip content={<TopicTooltip />} cursor={{ fill: '#F4F4F5' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {topicChartData.map((_, i) => (
                      <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Focus areas section ── */}
          <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 space-y-5 shadow-soft">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">🎯 Weak Topics & Focus Areas</h2>
                {analysisAt && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Last analyzed on {new Date(analysisAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#171717] hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xl transition duration-150 shadow-sm"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <span>Detecting weak topics…</span>
                  </>
                ) : '✨ Run AI Weak Topic Detection'}
              </button>
            </div>

            {analyzeError && (
              <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl px-4 py-3">
                {analyzeError}
              </div>
            )}

            {!weakDetails.length && !analyzing && (
              <p className="text-xs text-zinc-500">
                {analysisAt
                  ? '🎉 No weak topics detected — you are at or above the baseline on all major DSA categories!'
                  : 'Click "Run AI Weak Topic Detection" to evaluate your solved counts against industry interview baselines and get targeted problem recommendations.'}
              </p>
            )}

            {weakDetails.length > 0 && (
              <div className="space-y-3">
                {weakDetails.map((detail) => {
                  const topicProblems = problems.filter(
                    (p) => p.topic?.toLowerCase() === detail.topic?.toLowerCase()
                  );
                  return (
                    <FocusCard key={detail.topic} detail={detail} problems={topicProblems} />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
