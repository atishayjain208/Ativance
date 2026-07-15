import { useState, useEffect } from 'react';
import { getRoadmap, generateRoadmap, toggleRoadmapDay } from '../services/authService';

export default function Roadmap() {
  const [roadmap, setRoadmap]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError]       = useState('');

  // ── Load roadmap on mount ───────────────────────────────────────────────────
  useEffect(() => {
    fetchRoadmap();
  }, []);

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
      setError(err.response?.data?.message || 'Failed to toggle task completion.');
    } finally {
      setActioning(false);
    }
  };

  // ── Generate / Regenerate Roadmap ──────────────────────────────────────────
  const handleGenerate = async () => {
    setActioning(true); setError('');
    try {
      const data = await generateRoadmap();
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate study roadmap.');
    } finally {
      setActioning(false);
    }
  };

  // ── Derived progress metrics ────────────────────────────────────────────────
  const items           = roadmap?.items || [];
  const completedCount  = items.filter((it) => it.completed).length;
  const progressPct     = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm text-slate-400">Loading your weekly roadmap…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Roadmap</h1>
          <p className="text-slate-400 text-sm mt-1">
            Your personalized AI study plan. Target weak topics, revise your resume, and track daily goals.
          </p>
        </div>
        {roadmap && (
          <button
            onClick={handleGenerate}
            disabled={actioning}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            {actioning ? 'Generating…' : '↺ Regenerate Plan'}
          </button>
        )}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── No roadmap state ── */}
      {!roadmap ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl mx-auto">
            📅
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-200">No active roadmap</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Generate a personalized study roadmap targeting your resume gaps, missing skills, and weak DSA topics.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={actioning}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            {actioning ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Analyzing profile and generating plan…
              </>
            ) : '✨ Generate Weekly Roadmap'}
          </button>
        </div>
      ) : (
        <>
          {/* ── Progress Card ── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-5">
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weekly Progress</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">{completedCount}</span>
                <span className="text-xs text-slate-500">/ 7 days complete</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-center h-16 w-16 rounded-full border-4 border-indigo-500/10 bg-indigo-500/5">
              <span className="text-lg font-extrabold text-white">{progressPct}%</span>
            </div>
          </div>

          {/* ── 7-Day List ── */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.day}
                onClick={() => handleToggle(item.day)}
                className={`group flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all duration-150 select-none
                  ${item.completed
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'}`}
              >
                {/* Checkbox */}
                <div
                  className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-md border transition-colors
                    ${item.completed
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                      : 'border-slate-700 group-hover:border-slate-500 bg-slate-800/50'}`}
                >
                  {item.completed && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Day Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                      {item.day}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                      {item.focusArea}
                    </span>
                  </div>
                  <p
                    className={`text-sm text-slate-200 leading-relaxed transition-all
                      ${item.completed ? 'line-through text-slate-500' : ''}`}
                  >
                    {item.task}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeframe indicator */}
          {roadmap.weekStartDate && (
            <p className="text-[10px] text-slate-600 text-center">
              Plan active from {new Date(roadmap.weekStartDate).toLocaleDateString()} to {new Date(roadmap.weekEndDate).toLocaleDateString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
