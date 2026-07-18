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
  easy:   { label: 'Easy',   colour: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  medium: { label: 'Medium', colour: '#fbbf24', bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400'   },
  hard:   { label: 'Hard',   colour: '#f87171', bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400'     },
};

const BAR_PALETTE = [
  '#818cf8','#34d399','#fbbf24','#f87171','#38bdf8',
  '#a78bfa','#fb923c','#4ade80','#e879f9','#67e8f9',
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
    <div className={`flex-1 min-w-[120px] rounded-xl border ${m.bg} ${m.border} p-4 flex flex-col gap-1`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${m.text}`}>{m.label}</p>
      <p className="text-3xl font-extrabold text-white">{count}</p>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-1">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.colour }} />
      </div>
      <p className="text-[10px] text-slate-500">{pct}% of total</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom tooltip for topic chart
// ─────────────────────────────────────────────────────────────────────────────
function TopicTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-lg">
      <p className="font-semibold">{payload[0].payload.topic}</p>
      <p className="text-slate-400">{payload[0].value} solved</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty badge used inside problem list
// ─────────────────────────────────────────────────────────────────────────────
function DiffBadge({ difficulty }) {
  const styles = {
    Easy:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    Medium: 'bg-amber-500/15  text-amber-400   border-amber-500/25',
    Hard:   'bg-red-500/15    text-red-400     border-red-500/25',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[difficulty] ?? 'bg-slate-700 text-slate-400'}`}>
      {difficulty}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus area card — one weak topic + its recommended problems
// ─────────────────────────────────────────────────────────────────────────────
function FocusCard({ detail, problems }) {
  const [open, setOpen] = useState(true);
  const pct = Math.round((detail.count / detail.threshold) * 100);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-red-400 text-lg">⚠️</span>
          <div className="text-left min-w-0">
            <p className="font-semibold text-white text-sm">{detail.topic}</p>
            <p className="text-xs text-slate-400">
              {detail.count}/{detail.threshold} solved · {detail.gap} to go
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Mini progress ring */}
          <div className="relative h-9 w-9">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg] h-9 w-9">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#f87171" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
              {pct}%
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Problem list */}
      {open && (
        <div className="border-t border-slate-700/50 px-5 py-4 space-y-2">
          {problems.length === 0 ? (
            <p className="text-sm text-slate-500">No recommendations available yet.</p>
          ) : (
            <ul className="space-y-2">
              {problems.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-slate-600 text-xs w-5 shrink-0 text-right">{i + 1}.</span>
                  <p className="text-sm text-slate-300 flex-1 leading-snug">{p.title}</p>
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Solved by difficulty</p>
        <div className="grid grid-cols-3 gap-3">
          {['easy', 'medium', 'hard'].map((tier) => {
            const m = DIFF_META[tier];
            return (
              <div key={tier} className={`rounded-xl border ${m.bg} ${m.border} p-3 space-y-1.5`}>
                <label className={`block text-xs font-semibold ${m.text}`}>{m.label}</label>
                <input
                  type="number" min="0"
                  value={diff[tier]}
                  onChange={(e) => setDiffVal(tier, e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic counts */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Solved by topic</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TOPICS.map((topic) => (
            <div key={topic} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <label className="text-xs text-slate-300 truncate flex-1">{topic}</label>
              <input
                type="number" min="0"
                value={topics[topic] ?? 0}
                onChange={(e) => setTopic(topic, e.target.value)}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit" disabled={saving}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Saving…
          </>
        ) : saved ? (
          <span className="text-emerald-400">✓ Saved!</span>
        ) : 'Save Progress'}
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
            threshold: 8, // approximation for display; real thresholds come from /analyze
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
          <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm text-slate-400">Loading your progress…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-xl mx-auto mt-10 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        {fetchError}
        <button onClick={fetchProgress} className="ml-3 underline text-indigo-400">Retry</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">DSA Coach</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your problem-solving progress and get AI-powered focus recommendations.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="shrink-0 px-4 py-2 text-sm font-semibold rounded-xl border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
        >
          {showForm ? '✕ Close Form' : '✏️ Update Progress'}
        </button>
      </div>

      {/* ── No data banner ── */}
      {!progress && (
        <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl px-5 py-4 text-sm text-indigo-300 flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <p>You haven't logged any progress yet. Use the <strong>Update Progress</strong> form to enter your solved counts.</p>
        </div>
      )}

      {/* ── Update form panel ── */}
      {showForm && (
        <div className="space-y-4 animate-fadeIn">
          {/* LeetCode Sync Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">🔗 LeetCode Sync (Automatic)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Import problem-solving counts directly from your public LeetCode profile.
              </p>
            </div>

            <form onSubmit={handleSync} className="flex gap-3 max-w-md items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="leetcode-username" className="block text-xs font-semibold text-slate-400">LeetCode Username</label>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={syncing || !leetcodeUsername.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 h-[38px] min-w-[100px]"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Syncing…
                  </>
                ) : 'Sync Stats'}
              </button>
            </form>

            {syncError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">{syncError}</p>
            )}
            {syncSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-lg">{syncSuccess}</p>
            )}
            
            <p className="text-[10px] text-slate-600 leading-relaxed">
              ⚠️ LeetCode stats are fetched via an unofficial endpoint. Syncing depends on LeetCode's public servers and profile privacy settings.
            </p>
          </div>

          {/* Manual Entry Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">✏️ Manual Entry</h2>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">📊 Total Solved</h2>
              <span className="text-2xl font-extrabold text-white">{totalSolved}</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['easy', 'medium', 'hard'].map((tier) => (
                <DiffCard key={tier} tier={tier} count={diff[tier] ?? 0} total={totalSolved} />
              ))}
            </div>
          </div>

          {/* ── Topic bar chart ── */}
          {topicChartData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">📈 Topic-wise Solved</h2>
              <ResponsiveContainer width="100%" height={Math.max(200, topicChartData.length * 36)}>
                <BarChart data={topicChartData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                  <XAxis
                    type="number"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    type="category" dataKey="topic" width={120}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<TopicTooltip />} cursor={{ fill: '#1e293b' }} />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">🎯 Focus Areas</h2>
                {analysisAt && (
                  <p className="text-[10px] text-slate-600 mt-1">
                    Last analyzed {new Date(analysisAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/30"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Analyzing…
                  </>
                ) : '✨ Run AI Analysis'}
              </button>
            </div>

            {analyzeError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {analyzeError}
              </div>
            )}

            {!weakDetails.length && !analyzing && (
              <p className="text-sm text-slate-500">
                {analysisAt
                  ? '🎉 No weak topics — you\'re at or above the baseline on all major topics!'
                  : 'Hit "Run AI Analysis" to detect weak topics and get personalized problem recommendations.'}
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
