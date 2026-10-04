import { useState, useEffect } from 'react';
import {
  Map,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Target,
  Building2,
  BookOpen,
  Clock
} from 'lucide-react';
import { getRoadmap, generateRoadmap, toggleRoadmapDay, toggleSaveRoadmap, getSavedRoadmaps } from '../services/authService';

const MODES = [
  {
    id:    'profile',
    label: 'Based on My Profile',
    icon:  Target,
    desc:  'AI analyses your weak DSA areas, resume gaps, and GitHub profile to build a personalised plan.',
  },
  {
    id:    'company',
    label: 'Target Company + Test Date',
    icon:  Building2,
    desc:  'Enter a company name and your interview date. The plan is weighted to that company\'s known interview style.',
  },
  {
    id:    'topic',
    label: 'Custom Topic',
    icon:  BookOpen,
    desc:  'Type any topic (e.g. "System Design", "DBMS") for a focused, progressive daily study plan.',
  },
];

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

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

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);

  const [showGenerator, setShowGenerator] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);

  const [activeMode, setActiveMode] = useState('profile');
  const [targetCompany, setTargetCompany] = useState('');
  const [testDate, setTestDate] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [topicDays, setTopicDays] = useState('');

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

  const fetchSavedRoadmaps = async () => {
    setLoading(true); setError('');
    try {
      const data = await getSavedRoadmaps();
      setSavedRoadmaps(data.roadmaps);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch saved roadmaps.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (day) => {
    if (actioning || !roadmap?._id) return;
    setActioning(true); setError('');
    try {
      const data = await toggleRoadmapDay(roadmap._id, day);
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle task.');
    } finally {
      setActioning(false);
    }
  };

  const handleToggleSave = async () => {
    if (actioning || !roadmap?._id) return;
    setActioning(true); setError('');
    try {
      const data = await toggleSaveRoadmap(roadmap._id);
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save roadmap.');
    } finally {
      setActioning(false);
    }
  };

  const handleGenerate = async () => {
    setError('');

    if (activeMode === 'company') {
      if (!targetCompany.trim()) { setError('Please enter a company name.'); return; }
      if (!testDate) { setError('Please select a test/interview date.'); return; }
      if (daysUntil(testDate) < 1) { setError('Test date must be at least 1 day in the future.'); return; }
    }
    if (activeMode === 'topic' && !customTopic.trim()) {
      setError('Please enter a topic.'); return;
    }

    const payload = { mode: activeMode };
    if (activeMode === 'company') {
      payload.targetCompany = targetCompany.trim();
      payload.testDate = testDate;
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

  const items = roadmap?.items || [];
  const completedCount = items.filter((it) => it.completed).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const contextLabel = roadmapContextLabel(roadmap);

  const todayISO = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-[#7C5CFC] animate-spin" />
          <p className="text-xs font-semibold text-[#94A3B8]">Loading your study plan…</p>
        </div>
      </div>
    );
  }

  // Generator View
  if (!roadmap || showGenerator) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
              {roadmap ? 'Regenerate Roadmap' : 'Study Roadmap'}
            </h1>
            <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
              Choose how you want your AI plan to be generated.
            </p>
          </div>
          {roadmap && (
            <button
              onClick={() => { setShowGenerator(false); setError(''); }}
              className="px-4 py-2 bg-[#141821] hover:bg-[#181D27] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold rounded-xl border border-[#1F2633] transition shadow-soft flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plan
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-[#141821] border border-[#1F2633] rounded-2xl overflow-hidden shadow-card">
          <div className="flex border-b border-[#1F2633] divide-x divide-[#1F2633]">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  id={`roadmap-mode-tab-${m.id}`}
                  onClick={() => { setActiveMode(m.id); setError(''); }}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 px-2 text-xs font-semibold transition-colors focus:outline-none
                    ${activeMode === m.id
                      ? 'bg-[#181D27] text-[#7C5CFC] border-b-2 border-[#7C5CFC] -mb-px'
                      : 'text-[#64748B] hover:bg-[#181D27]/50 hover:text-[#94A3B8]'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="leading-tight text-center">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6 space-y-5">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {MODES.find((m) => m.id === activeMode)?.desc}
            </p>

            {activeMode === 'company' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="roadmap-target-company" className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Target Company
                  </label>
                  <input
                    id="roadmap-target-company"
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Amazon, Google, TCS, Infosys…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2633] bg-[#181D27] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition"
                  />
                </div>
                <div>
                  <label htmlFor="roadmap-test-date" className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Test / Interview Date
                  </label>
                  <input
                    id="roadmap-test-date"
                    type="date"
                    value={testDate}
                    min={todayISO}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2633] bg-[#181D27] text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC] transition"
                  />
                  {testDate && daysUntil(testDate) > 0 && (
                    <p className="mt-1.5 text-[11px] text-[#22D3EE] font-medium">
                      {daysUntil(testDate)} day{daysUntil(testDate) !== 1 ? 's' : ''} until your interview
                      {daysUntil(testDate) > 30 ? ' — plan will cover the first 30 days' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeMode === 'topic' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="roadmap-custom-topic" className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Topic
                  </label>
                  <input
                    id="roadmap-custom-topic"
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g. System Design, Dynamic Programming, DBMS…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2633] bg-[#181D27] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition"
                  />
                </div>
                <div>
                  <label htmlFor="roadmap-topic-days" className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Number of Days <span className="font-normal text-[#64748B]">(optional — default 7, max 30)</span>
                  </label>
                  <input
                    id="roadmap-topic-days"
                    type="number"
                    min={1}
                    max={30}
                    value={topicDays}
                    onChange={(e) => setTopicDays(e.target.value)}
                    placeholder="7"
                    className="w-32 px-3.5 py-2.5 rounded-xl border border-[#1F2633] bg-[#181D27] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition"
                  />
                </div>
              </div>
            )}

            {activeMode === 'profile' && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20">
                <Sparkles className="h-4 w-4 text-[#22D3EE] shrink-0 mt-0.5" />
                <p className="text-xs text-[#9B7CFF] leading-relaxed">
                  Your roadmap will be built from your DSA weak areas, resume analysis, and GitHub profile data. Make sure your profile is up to date for the best results.
                </p>
              </div>
            )}

            <button
              id="roadmap-generate-submit"
              onClick={handleGenerate}
              disabled={actioning}
              className="w-full py-3 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-glow-purple transition flex items-center justify-center gap-2"
            >
              {actioning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating your plan…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate AI Roadmap</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Saved View
  if (showSaved) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
              Saved Roadmaps
            </h1>
            <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
              Your previously saved study plans.
            </p>
          </div>
          <button
            onClick={() => { setShowSaved(false); setError(''); }}
            className="px-4 py-2 bg-[#141821] hover:bg-[#181D27] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold rounded-xl border border-[#1F2633] transition shadow-soft flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plan
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedRoadmaps.length === 0 ? (
          <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-10 text-center shadow-card">
            <Bookmark className="h-10 w-10 mx-auto text-[#64748B] mb-3" />
            <p className="text-[#94A3B8] text-sm font-medium">You haven't saved any roadmaps yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedRoadmaps.map((r) => (
              <div 
                key={r._id}
                onClick={() => {
                  setRoadmap(r);
                  setShowSaved(false);
                }}
                className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 cursor-pointer hover:border-[#7C5CFC] hover:shadow-card transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#F8FAFC] text-base">{roadmapContextLabel(r)}</h3>
                  <span className="text-xs font-semibold text-[#7C5CFC] bg-[#7C5CFC]/10 px-2.5 py-1 rounded-md border border-[#7C5CFC]/20">
                    {r.items?.length || 0} Days
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                  <span>Saved on {new Date(r.savedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{r.items?.filter(i => i.completed).length || 0} completed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Active Roadmap View
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">Weekly Roadmap</h1>
          {contextLabel && (
            <p className="text-xs sm:text-sm font-semibold text-[#7C5CFC] mt-1">
              {contextLabel}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setShowSaved(true); setShowGenerator(false); fetchSavedRoadmaps(); }}
            className="px-4 py-2 bg-[#141821] hover:bg-[#181D27] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold rounded-xl border border-[#1F2633] transition shadow-soft flex items-center gap-1.5"
          >
            <Bookmark className="h-4 w-4" />
            View Saved
          </button>
          <button
            id="roadmap-save-btn"
            onClick={handleToggleSave}
            className={`px-4 py-2 flex items-center gap-1.5 text-xs font-semibold rounded-xl border transition shadow-soft
              ${roadmap.isSaved 
                ? 'bg-[#7C5CFC]/10 border-[#7C5CFC]/30 text-[#7C5CFC]' 
                : 'bg-[#141821] hover:bg-[#181D27] text-[#94A3B8] border-[#1F2633]'}`}
          >
            <Bookmark className={`h-4 w-4 ${roadmap.isSaved ? 'fill-[#7C5CFC]' : ''}`} />
            {roadmap.isSaved ? 'Saved' : 'Save Plan'}
          </button>
          <button
            id="roadmap-regenerate-btn"
            onClick={() => { setShowGenerator(true); setError(''); setMeta(null); setShowSaved(false); }}
            className="px-4 py-2 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] text-white text-xs font-bold rounded-xl transition shadow-glow-purple flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {meta?.truncationNote && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] text-xs font-medium">
          <span className="shrink-0 mt-0.5">⚡</span>
          <span>{meta.truncationNote}</span>
        </div>
      )}

      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 flex items-center justify-between gap-5 shadow-card">
        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Goal Progress</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">{completedCount}</span>
            <span className="text-xs font-medium text-[#94A3B8]">/ {items.length} day{items.length !== 1 ? 's' : ''} completed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#181D27] overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#22D3EE] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl border border-[#7C5CFC]/20 bg-[#7C5CFC]/10 shadow-glow-purple">
          <span className="text-base font-extrabold text-[#22D3EE]">{progressPct}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.day}
            onClick={() => handleToggle(item.day)}
            className={`group flex items-start gap-4 rounded-2xl border p-5 cursor-pointer transition-all duration-150 select-none shadow-card
              ${item.completed
                ? 'bg-[#181D27]/50 border-[#1F2633] opacity-60'
                : 'bg-[#141821] border-[#1F2633] hover:border-[#2E384D] hover:shadow-hover'}`}
          >
            <div
              className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-lg border transition-colors
                ${item.completed
                  ? 'bg-[#34D399] border-[#34D399] text-[#090B10]'
                  : 'border-[#1F2633] group-hover:border-[#7C5CFC] bg-[#181D27]'}`}
            >
              {item.completed && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#7C5CFC] group-hover:text-[#9B7CFF]">
                  {item.day}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#181D27] border border-[#1F2633] text-[#94A3B8]">
                  {item.focusArea}
                </span>
              </div>
              <p
                className={`text-xs sm:text-sm font-medium text-[#F8FAFC] leading-relaxed transition-all
                  ${item.completed ? 'line-through text-[#64748B]' : ''}`}
              >
                {item.task}
              </p>
            </div>
          </div>
        ))}
      </div>

      {roadmap.weekStartDate && (
        <p className="text-[11px] text-[#64748B] text-center pb-2">
          Plan generated on {new Date(roadmap.weekStartDate).toLocaleDateString()}
          {roadmap.weekEndDate && ` · active until ${new Date(roadmap.weekEndDate).toLocaleDateString()}`}
        </p>
      )}
    </div>
  );
}
