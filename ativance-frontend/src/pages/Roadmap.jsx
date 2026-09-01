import { useState, useEffect } from 'react';
import { getRoadmap, generateRoadmap, toggleRoadmapDay } from '../services/authService';

// ── Icons ─────────────────────────────────────────────────────────────────────
const SpinnerIcon = ({ cls = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${cls}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ── Mode tab config ───────────────────────────────────────────────────────────
const MODES = [
  {
    id:    'profile',
    label: 'Based on My Profile',
    icon:  '🎯',
    desc:  'AI analyses your weak DSA areas, resume gaps, and GitHub profile to build a personalised plan.',
  },
  {
    id:    'company',
    label: 'Target Company + Test Date',
    icon:  '🏢',
    desc:  'Enter a company name and your interview date. The plan is weighted to that company\'s known interview style.',
  },
  {
    id:    'topic',
    label: 'Custom Topic',
    icon:  '📚',
    desc:  'Type any topic (e.g. "System Design", "DBMS") for a focused, progressive daily study plan.',
  },
];

// ── Helper: compute days remaining until a date ───────────────────────────────
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

// ── Helper: build a human-readable roadmap context label ─────────────────────
const roadmapContextLabel = (roadmap) => {
  if (!roadmap) return null;
  const { mode, targetCompany, testDate, customTopic, items } = roadmap;
  const dayCount = items?.length ?? 0;

  if (mode === 'company' && targetCompany) {
    const remaining = daysUntil(testDate);
    const suffix    =
      remaining !== null
        ? remaining > 0
          ? ` — ${remaining} day${remaining !== 1 ? 's' : ''} left`
          : ' — Test date reached!'
        : '';
    return `Roadmap for: ${targetCompany}${suffix}`;
  }
  if (mode === 'topic' && customTopic) {
    return `Roadmap for: ${customTopic}`;
  }
  return `Personalised ${dayCount}-Day Roadmap`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Roadmap() {
  const [roadmap,    setRoadmap]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [actioning,  setActioning]  = useState(false);
  const [error,      setError]      = useState('');
  const [meta,       setMeta]       = useState(null);

  // Mode-selection view vs. roadmap view
  const [showGenerator, setShowGenerator] = useState(false);

  // Mode form state
  const [activeMode,     setActiveMode]     = useState('profile');
  const [targetCompany,  setTargetCompany]  = useState('');
  const [testDate,       setTestDate]       = useState('');
  const [customTopic,    setCustomTopic]    = useState('');
  const [topicDays,      setTopicDays]      = useState('');

  // ── Load roadmap on mount ───────────────────────────────────────────────────
  useEffect(() => { fetchRoadmap(); }, []);

  const fetchRoadmap = async () => {
    setLoading(true); setError('');
    try {
      const data = await getRoadmap();
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch roadmap.');
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle task completion ──────────────────────────────────────────────────
  const handleToggle = async (day) => {
    if (actioning) return;
    setActioning(true); setError('');
    try {
      const data = await toggleRoadmapDay(day);
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle task.');
    } finally {
      setActioning(false);
    }
  };

  // ── Submit generation form ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    setError('');

    // Basic client-side validation
    if (activeMode === 'company') {
      if (!targetCompany.trim()) { setError('Please enter a company name.'); return; }
      if (!testDate)             { setError('Please select a test/interview date.'); return; }
      if (daysUntil(testDate) < 1) { setError('Test date must be at least 1 day in the future.'); return; }
    }
    if (activeMode === 'topic' && !customTopic.trim()) {
      setError('Please enter a topic.'); return;
    }

    const payload = { mode: activeMode };
    if (activeMode === 'company') {
      payload.targetCompany = targetCompany.trim();
      payload.testDate      = testDate;
    }
    if (activeMode === 'topic') {
      payload.customTopic = customTopic.trim();
      if (topicDays && !isNaN(parseInt(topicDays, 10))) {
        payload.days = parseInt(topicDays, 10);
      }
    }

    setActioning(true);
    try {
      const data = await generateRoadmap(payload);
      setRoadmap(data.roadmap);
      setMeta(data.meta || null);
      setShowGenerator(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate roadmap.');
    } finally {
      setActioning(false);
    }
  };

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const items          = roadmap?.items || [];
  const completedCount = items.filter((it) => it.completed).length;
  const progressPct    = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const contextLabel   = roadmapContextLabel(roadmap);

  // ── Today's min date for the date picker ───────────────────────────────────
  const todayISO = new Date().toISOString().split('T')[0];

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon cls="h-8 w-8 text-indigo-600" />
          <p className="text-xs font-semibold text-zinc-500">Loading your study plan…</p>
        </div>
      </div>
    );
  }

  // ── MODE SELECTION / GENERATOR VIEW ─────────────────────────────────────────
  if (!roadmap || showGenerator) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
              {roadmap ? 'Regenerate Roadmap' : 'Study Roadmap'}
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">
              Choose how you want your plan to be generated.
            </p>
          </div>
          {roadmap && (
            <button
              onClick={() => { setShowGenerator(false); setError(''); }}
              className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-semibold rounded-xl border border-[#E5E5E0] hover:border-zinc-300 transition shadow-soft"
            >
              ← Back to Plan
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        {/* Mode tabs */}
        <div className="bg-white border border-[#E5E5E0] rounded-2xl overflow-hidden shadow-card">
          {/* Tab bar */}
          <div className="flex border-b border-[#E5E5E0] divide-x divide-[#E5E5E0]">
            {MODES.map((m) => (
              <button
                key={m.id}
                id={`roadmap-mode-tab-${m.id}`}
                onClick={() => { setActiveMode(m.id); setError(''); }}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-[11px] font-semibold transition-colors focus:outline-none
                  ${activeMode === m.id
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 -mb-px'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'}`}
              >
                <span className="text-base">{m.icon}</span>
                <span className="leading-tight text-center">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div className="p-6 space-y-5">
            {/* Mode description */}
            <p className="text-xs text-zinc-500 leading-relaxed">
              {MODES.find((m) => m.id === activeMode)?.desc}
            </p>

            {/* ── Company inputs ── */}
            {activeMode === 'company' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="roadmap-target-company" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Target Company
                  </label>
                  <input
                    id="roadmap-target-company"
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Amazon, Google, TCS, Infosys…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>
                <div>
                  <label htmlFor="roadmap-test-date" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Test / Interview Date
                  </label>
                  <input
                    id="roadmap-test-date"
                    type="date"
                    value={testDate}
                    min={todayISO}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-white text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                  {testDate && daysUntil(testDate) > 0 && (
                    <p className="mt-1.5 text-[11px] text-indigo-600 font-medium">
                      {daysUntil(testDate)} day{daysUntil(testDate) !== 1 ? 's' : ''} until your interview
                      {daysUntil(testDate) > 30 ? ' — plan will cover the first 30 days' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Topic inputs ── */}
            {activeMode === 'topic' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="roadmap-custom-topic" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Topic
                  </label>
                  <input
                    id="roadmap-custom-topic"
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g. System Design, Dynamic Programming, DBMS…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>
                <div>
                  <label htmlFor="roadmap-topic-days" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Number of Days <span className="font-normal text-zinc-400">(optional — default 7, max 30)</span>
                  </label>
                  <input
                    id="roadmap-topic-days"
                    type="number"
                    min={1}
                    max={30}
                    value={topicDays}
                    onChange={(e) => setTopicDays(e.target.value)}
                    placeholder="7"
                    className="w-32 px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Profile mode — no extra inputs needed */}
            {activeMode === 'profile' && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-indigo-500 text-lg mt-0.5">ℹ️</span>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Your roadmap will be built from your DSA weak areas, resume analysis, and GitHub profile data. Make sure your profile is up to date for the best results.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              id="roadmap-generate-submit"
              onClick={handleGenerate}
              disabled={actioning}
              className="w-full py-3 bg-[#171717] hover:bg-black disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              {actioning ? (
                <>
                  <SpinnerIcon />
                  <span>Generating your plan…</span>
                </>
              ) : (
                <span>✨ Generate Roadmap</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ROADMAP VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Study Roadmap</h1>
          {contextLabel && (
            <p className="text-xs sm:text-sm font-semibold text-indigo-600 mt-1">
              {contextLabel}
            </p>
          )}
        </div>
        <button
          id="roadmap-regenerate-btn"
          onClick={() => { setShowGenerator(true); setError(''); setMeta(null); }}
          className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl border border-[#E5E5E0] hover:border-zinc-300 transition shadow-soft"
        >
          ↺ Regenerate Plan
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
          <AlertIcon />
          <span>{error}</span>
        </div>
      )}

      {/* ── Truncation / meta note ── */}
      {meta?.truncationNote && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-medium">
          <span className="shrink-0 mt-0.5">⚡</span>
          <span>{meta.truncationNote}</span>
        </div>
      )}

      {/* ── Progress Card ── */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 flex items-center justify-between gap-5 shadow-soft">
        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Goal Progress</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">{completedCount}</span>
            <span className="text-xs font-medium text-zinc-500">/ {items.length} day{items.length !== 1 ? 's' : ''} completed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl border border-indigo-100 bg-indigo-50/70 shadow-sm">
          <span className="text-base font-extrabold text-indigo-700">{progressPct}%</span>
        </div>
      </div>

      {/* ── Day-by-Day List ── */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.day}
            onClick={() => handleToggle(item.day)}
            className={`group flex items-start gap-4 rounded-2xl border p-5 cursor-pointer transition-all duration-150 select-none shadow-soft
              ${item.completed
                ? 'bg-zinc-50/80 border-zinc-200/80 opacity-70'
                : 'bg-white border-[#E5E5E0] hover:border-zinc-300 hover:shadow-card'}`}
          >
            {/* Checkbox */}
            <div
              className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-lg border transition-colors
                ${item.completed
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'border-zinc-300 group-hover:border-zinc-400 bg-white'}`}
            >
              {item.completed && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Day Details */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  {item.day}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/70 text-zinc-600">
                  {item.focusArea}
                </span>
                {actioning && (
                  <SpinnerIcon cls="h-3 w-3 text-zinc-400" />
                )}
              </div>
              <p
                className={`text-xs sm:text-sm font-medium text-zinc-800 leading-relaxed transition-all
                  ${item.completed ? 'line-through text-zinc-400' : ''}`}
              >
                {item.task}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Timeframe footer ── */}
      {roadmap.weekStartDate && (
        <p className="text-[11px] text-zinc-400 text-center pb-2">
          Plan generated on {new Date(roadmap.weekStartDate).toLocaleDateString()}
          {roadmap.weekEndDate && ` · active until ${new Date(roadmap.weekEndDate).toLocaleDateString()}`}
        </p>
      )}
    </div>
  );
}

