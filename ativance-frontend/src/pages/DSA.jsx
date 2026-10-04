import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Code2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Edit3,
  X,
  Target
} from 'lucide-react';
import { getDSAProgress, updateDSAProgress, analyzeDSA, syncLeetcodeStats } from '../services/authService';

const TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Binary Search', 'Linked Lists', 'Stacks', 'Queues', 'Trees',
  'Graphs', 'Recursion', 'Backtracking', 'Dynamic Programming',
  'Greedy', 'Heap', 'Trie',
];

const DIFF_META = {
  easy:   { label: 'Easy',   colour: '#34D399', bg: 'bg-[#34D399]/10', border: 'border-[#34D399]/20', text: 'text-[#34D399]', barBg: '#34D399' },
  medium: { label: 'Medium', colour: '#FBBF24', bg: 'bg-[#FBBF24]/10', border: 'border-[#FBBF24]/20', text: 'text-[#FBBF24]', barBg: '#FBBF24' },
  hard:   { label: 'Hard',   colour: '#F87171', bg: 'bg-[#F87171]/10', border: 'border-[#F87171]/20', text: 'text-[#F87171]', barBg: '#F87171' },
};

const BAR_PALETTE = [
  '#7C5CFC', '#34D399', '#FBBF24', '#F87171', '#22D3EE',
  '#9B7CFF', '#F97316', '#10B981', '#EC4899', '#06B6D4',
];

const buildTopicMap = (arr = []) => {
  const map = {};
  for (const { topic, count } of arr) map[topic] = count;
  return map;
};

function DiffCard({ tier, count, total }) {
  const m   = DIFF_META[tier];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={`flex-1 min-w-[130px] rounded-2xl border ${m.bg} ${m.border} p-4 flex flex-col gap-1.5 shadow-card`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${m.text}`}>{m.label}</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">{count}</p>
      <div className="h-2 w-full rounded-full bg-[#181D27] overflow-hidden mt-1">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.barBg }} />
      </div>
      <p className="text-[11px] font-medium text-[#64748B]">{pct}% of total problems</p>
    </div>
  );
}

function TopicTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#181D27] border border-[#1F2633] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] shadow-card">
      <p className="font-bold">{payload[0].payload.topic}</p>
      <p className="text-[#94A3B8]">{payload[0].value} problems solved</p>
    </div>
  );
}

function DiffBadge({ difficulty }) {
  const styles = {
    Easy:   'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
    Medium: 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20',
    Hard:   'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${styles[difficulty] ?? 'bg-[#181D27] text-[#94A3B8] border-[#1F2633]'}`}>
      {difficulty}
    </span>
  );
}

function problemHref(p) {
  if (p.slug && p.slug.trim()) {
    return `https://leetcode.com/problems/${p.slug.trim()}/`;
  }
  return `https://leetcode.com/problemset/?search=${encodeURIComponent(p.title)}`;
}

function FocusCard({ detail, problems }) {
  const [open, setOpen] = useState(true);
  const pct = Math.round((detail.count / detail.threshold) * 100);

  return (
    <div className="bg-[#141821] border border-[#1F2633] rounded-2xl overflow-hidden shadow-card transition-all">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#181D27]/70 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <AlertCircle className="h-5 w-5 text-[#F87171] shrink-0" />
          <div className="text-left min-w-0">
            <p className="font-bold text-[#F8FAFC] text-sm">{detail.topic}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {detail.count}/{detail.threshold} solved · {detail.gap} more needed for solid interview level
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative h-9 w-9">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg] h-9 w-9">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1F2633" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#F87171" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#F8FAFC]">
              {pct}%
            </span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-[#64748B]" /> : <ChevronDown className="h-4 w-4 text-[#64748B]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1F2633] px-5 py-4 space-y-2 bg-[#181D27]/40">
          {problems.length === 0 ? (
            <p className="text-xs text-[#64748B]">No practice problem recommendations available yet.</p>
          ) : (
            <ul className="space-y-2">
              {problems.map((p, i) => (
                <li key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141821] border border-[#1F2633] shadow-soft">
                  <span className="text-[#64748B] text-xs w-5 shrink-0 text-right font-medium">{i + 1}.</span>
                  <a
                    href={problemHref(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-semibold text-[#7C5CFC] hover:text-[#9B7CFF] flex items-center gap-1.5 flex-1 transition-colors truncate"
                  >
                    <span>{p.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
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
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Solved by difficulty</p>
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
                  className="w-full bg-[#141821] border border-[#1F2633] rounded-xl px-2.5 py-1.5 text-sm text-[#F8FAFC] font-bold text-center focus:outline-none focus:border-[#7C5CFC] shadow-soft"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Solved by topic category</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TOPICS.map((topic) => (
            <div key={topic} className="bg-[#181D27] border border-[#1F2633] rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-soft">
              <label className="text-xs font-medium text-[#94A3B8] truncate flex-1">{topic}</label>
              <input
                type="number" min="0"
                value={topics[topic] ?? 0}
                onChange={(e) => setTopic(topic, e.target.value)}
                className="w-14 bg-[#141821] border border-[#1F2633] rounded-lg px-2 py-1 text-xs text-[#F8FAFC] font-bold text-center focus:outline-none focus:border-[#7C5CFC]"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-3.5 py-2.5">{error}</p>
      )}

      <button
        type="submit" disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-glow-purple flex items-center justify-center gap-2"
      >
        {saving ? (
          <span>Saving changes…</span>
        ) : saved ? (
          <span className="text-[#34D399]">✓ Progress saved successfully!</span>
        ) : 'Save DSA Counts'}
      </button>
    </form>
  );
}

export default function DSACoach() {
  const [progress, setProgress]           = useState(null);
  const [totalSolved, setTotalSolved]     = useState(0);
  const [weakDetails, setWeakDetails]     = useState([]);
  const [problems, setProblems]           = useState([]);
  const [analysisAt, setAnalysisAt]       = useState(null);

  const [loading, setLoading]             = useState(true);
  const [analyzing, setAnalyzing]         = useState(false);
  const [fetchError, setFetchError]       = useState('');
  const [analyzeError, setAnalyzeError]   = useState('');
  const [showForm, setShowForm]           = useState(false);

  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [syncing, setSyncing]                   = useState(false);
  const [syncError, setSyncError]               = useState('');
  const [syncSuccess, setSyncSuccess]           = useState('');

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
      if (data.progress.weakTopics?.length) {
        const topicMap = buildTopicMap(data.progress.solvedByTopic);
        setWeakDetails(
          (data.progress.weakTopics || []).map((t) => ({
            topic:     t,
            count:     topicMap[t] ?? 0,
            threshold: 8,
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
      setWeakDetails([]); setProblems([]); setAnalysisAt(null);
      setSyncSuccess(data.message || 'Synced successfully!');
      setTimeout(() => setSyncSuccess(''), 4000);
    } catch (err) {
      setSyncError(err.response?.data?.message || 'Failed to sync with LeetCode. Verify username is public.');
    } finally {
      setSyncing(false);
    }
  };

  const topicChartData = (progress?.solvedByTopic ?? [])
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((e) => ({ topic: e.topic, count: e.count }));

  const diff = progress?.solvedByDifficulty ?? { easy: 0, medium: 0, hard: 0 };

  const topicMap   = buildTopicMap(progress?.solvedByTopic);
  const initTopics = Object.fromEntries(TOPICS.map((t) => [t, topicMap[t] ?? 0]));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-[#7C5CFC] animate-spin" />
          <p className="text-xs font-semibold text-[#94A3B8]">Loading your DSA coach profile…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-xl mx-auto mt-10 px-4 py-3 rounded-2xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium shadow-card flex items-center justify-between">
        <span>{fetchError}</span>
        <button onClick={fetchProgress} className="underline font-bold text-[#7C5CFC]">Retry</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">DSA Coach</h1>
          <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
            Track problem-solving milestones, identify topic gaps, and practice AI-curated question sets.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="shrink-0 px-4 py-2 text-xs font-semibold rounded-xl border border-[#1F2633] bg-[#141821] hover:bg-[#181D27] text-[#F8FAFC] transition-all shadow-soft flex items-center gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4 text-[#7C5CFC]" />}
          <span>{showForm ? 'Close Panel' : 'Update Progress'}</span>
        </button>
      </div>

      {!progress && (
        <div className="bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 rounded-2xl px-5 py-4 text-xs sm:text-sm text-[#9B7CFF] flex items-start gap-3 shadow-card">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-[#22D3EE]" />
          <p>
            You have not logged any DSA progress yet. Sync your <strong>LeetCode username</strong> or enter your counts manually to begin.
          </p>
        </div>
      )}

      {showForm && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 space-y-4 shadow-card">
            <div>
              <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#22D3EE]" />
                Auto-Sync from LeetCode
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                Import problem-solving counts directly from your public LeetCode profile.
              </p>
            </div>

            <form onSubmit={handleSync} className="flex gap-3 max-w-md items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="leetcode-username" className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">LeetCode Username</label>
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
                  className="w-full bg-[#181D27] border border-[#1F2633] rounded-xl px-3.5 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC] placeholder:text-[#64748B] shadow-soft"
                />
              </div>
              <button
                type="submit"
                disabled={syncing || !leetcodeUsername.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 h-[40px] shadow-glow-purple"
              >
                {syncing ? 'Syncing…' : 'Sync Profile'}
              </button>
            </form>

            {syncError && (
              <div className="text-xs text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 px-4 py-3 rounded-xl space-y-1.5">
                <p>{syncError}</p>
              </div>
            )}
            {syncSuccess && (
              <p className="text-xs font-semibold text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/20 px-4 py-3 rounded-xl">{syncSuccess}</p>
            )}
          </div>

          <div id="manual-entry-section" className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 shadow-card space-y-4">
            <h2 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Manual Entry Fallback</h2>
            <UpdateForm
              initial={{ diff: { easy: diff.easy, medium: diff.medium, hard: diff.hard }, topics: initTopics }}
              onSaved={handleSaved}
            />
          </div>
        </div>
      )}

      {progress && (
        <>
          <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 space-y-4 shadow-card">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#1F2633]">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Total Questions Solved</h2>
                {progress?.dataSource === 'leetcode-auto' ? (
                  <span className="text-[10px] font-bold text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-full px-2.5 py-0.5">
                    Auto-synced from LeetCode ({progress?.leetcodeUsername || 'profile'})
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#94A3B8] bg-[#181D27] border border-[#1F2633] rounded-full px-2.5 py-0.5">
                    Manually Entered
                  </span>
                )}
              </div>
              <span className="text-2xl font-black text-[#F8FAFC] tracking-tight">{totalSolved}</span>
            </div>
            <div className="flex gap-3.5 flex-wrap">
              {['easy', 'medium', 'hard'].map((tier) => (
                <DiffCard key={tier} tier={tier} count={diff[tier] ?? 0} total={totalSolved} />
              ))}
            </div>
          </div>

          {topicChartData.length > 0 && (
            <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 space-y-4 shadow-card">
              <h2 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Topic-wise Distribution</h2>
              <ResponsiveContainer width="100%" height={Math.max(200, topicChartData.length * 36)}>
                <BarChart data={topicChartData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={{ stroke: '#1F2633' }} tickLine={false}
                  />
                  <YAxis
                    type="category" dataKey="topic" width={120}
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#1F2633' }} tickLine={false}
                  />
                  <Tooltip content={<TopicTooltip />} cursor={{ fill: '#181D27' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {topicChartData.map((_, i) => (
                      <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 space-y-5 shadow-card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#F87171]" />
                  Weak Topics & Focus Areas
                </h2>
                {analysisAt && (
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Last analyzed on {new Date(analysisAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition duration-150 shadow-glow-purple"
              >
                {analyzing ? (
                  <span>Detecting weak topics…</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#22D3EE]" />
                    <span>Run AI Weak Topic Detection</span>
                  </>
                )}
              </button>
            </div>

            {analyzeError && (
              <div className="text-xs font-medium text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-4 py-3">
                {analyzeError}
              </div>
            )}

            {!weakDetails.length && !analyzing && (
              <p className="text-xs text-[#94A3B8]">
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
