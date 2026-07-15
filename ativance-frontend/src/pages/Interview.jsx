import { useState, useRef, useEffect } from 'react';
import { startInterview, nextInterviewQuestion, evaluateInterview } from '../services/authService';

const PRESETS = ['Google', 'Amazon', 'Microsoft', 'Flipkart', 'Meta', 'Netflix'];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components for Evaluation Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function ScoreCard({ label, score, colorClass }) {
  const widthPct = `${(score / 10) * 100}%`;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-xl font-black text-white">{score}<span className="text-[10px] text-slate-500 font-normal">/10</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-1">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: widthPct }} />
      </div>
    </div>
  );
}

function EvaluationSummary({ evaluation, onExit }) {
  const { technicalDepth, communication, confidence, tips } = evaluation;

  return (
    <div className="space-y-6 animate-fadeIn py-2">
      {/* Header */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center space-y-2">
        <p className="text-emerald-400 font-bold text-base">🎉 Interview Performance Evaluated</p>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Recruiters analyzed your responses. Here is your scorecard and recommended actions.
        </p>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScoreCard label="Technical Depth" score={technicalDepth} colorClass="bg-indigo-500" />
        <ScoreCard label="Communication" score={communication} colorClass="bg-emerald-400" />
        <ScoreCard label="Confidence" score={confidence} colorClass="bg-amber-400" />
      </div>

      {/* Actionable Tips Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>💡</span> Question-by-Question Tips
        </h3>

        <div className="space-y-4">
          {tips.map((item, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-750 rounded-xl p-4 space-y-2.5">
              <div className="flex gap-2 items-start">
                <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-[10px] font-bold text-slate-300 mt-0.5">
                  Q{idx + 1}
                </span>
                <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                  {item.question}
                </p>
              </div>
              <div className="border-t border-slate-750/60 pt-2 flex gap-2 items-start text-xs text-slate-400 leading-relaxed pl-7">
                <span className="text-indigo-400 font-semibold shrink-0">Feedback:</span>
                <p>{item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={onExit}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
      >
        Exit Interview Lobby
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main simulator component
// ─────────────────────────────────────────────────────────────────────────────
export default function Interview() {
  // ── Session Setup State ─────────────────────────────────────────────────────
  const [company, setCompany]     = useState('Google');
  const [customCompany, setCustomCompany] = useState('');
  const [type, setType]           = useState('Technical');
  const [sessionId, setSessionId] = useState(null);

  // ── Active Chat State ───────────────────────────────────────────────────────
  const [chat, setChat]           = useState([]); // [{ role, message, timestamp }]
  const [answerInput, setAnswerInput] = useState('');
  const [status, setStatus]       = useState(null); // 'active', 'completed'

  // ── Evaluation State ────────────────────────────────────────────────────────
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // ── UI States ───────────────────────────────────────────────────────────────
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');

  const chatEndRef = useRef(null);

  // ── Auto Scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, sending, evaluating]);

  // ── Start Simulation ────────────────────────────────────────────────────────
  const handleStart = async (e) => {
    e.preventDefault();
    const target = company === 'Other' ? customCompany.trim() : company;
    if (!target) {
      setError('Please specify a target company.');
      return;
    }

    setLoading(true); setError(''); setChat([]); setEvaluation(null);
    try {
      const data = await startInterview(target, type);
      setSessionId(data.sessionId);
      setStatus(data.status);
      setChat([
        {
          role:      'interviewer',
          message:   data.question,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview simulation.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit Answer ───────────────────────────────────────────────────────────
  const handleSendAnswer = async (e) => {
    e.preventDefault();
    const text = answerInput.trim();
    if (!text || sending || !sessionId) return;

    setAnswerInput('');
    setSending(true);
    setError('');

    // Optimistically push the candidate's answer
    const optAnswer = { role: 'candidate', message: text, timestamp: new Date() };
    setChat((prev) => [...prev, optAnswer]);

    try {
      const data = await nextInterviewQuestion(sessionId, text);
      setStatus(data.status);
      setChat(data.chat || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send answer. Please try again.');
      // Rollback optimistic answer
      setChat((prev) => prev.filter((c) => c !== optAnswer));
    } finally {
      setSending(false);
    }
  };

  // ── Trigger Evaluation ──────────────────────────────────────────────────────
  const handleEvaluate = async () => {
    if (!sessionId || evaluating) return;
    setEvaluating(true); setError('');
    try {
      const data = await evaluateInterview(sessionId);
      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to evaluate interview performance.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setChat([]);
    setAnswerInput('');
    setStatus(null);
    setEvaluation(null);
    setError('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Interview Simulator</h1>
        <p className="text-slate-400 text-sm mt-1">
          Simulate standard tech interviews under pressure. Receive personalized AI follow-ups.
        </p>
      </div>

      {/* ── Setup Mode (before session starts) ── */}
      {!sessionId && (
        <form onSubmit={handleStart} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Configure Mock Session</h2>

          {/* Company Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Target Company</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => { setCompany(p); setError(''); }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition
                    ${company === p
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setCompany('Other'); setError(''); }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition
                  ${company === 'Other'
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
              >
                Other
              </button>
            </div>

            {company === 'Other' && (
              <input
                id="custom-company-input"
                type="text"
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder="Enter company name (e.g. Stripe)"
                className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Interview Round Type</label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Technical', 'HR', 'Behavioral'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition
                    ${type === t
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Entering lobby and starting…
              </>
            ) : '🎬 Start Simulation'}
          </button>
        </form>
      )}

      {/* ── Active / Concluded Simulation Mode ── */}
      {sessionId && (
        <div className="space-y-6">
          {/* Main Simulation Board (shows chat log or evaluation dashboard) */}
          {evaluation ? (
            <EvaluationSummary evaluation={evaluation} onExit={handleReset} />
          ) : (
            <div className="flex flex-col h-[calc(100vh-14rem)] bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
              {/* Header Banner */}
              <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mocking Interview</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {company === 'Other' ? customCompany : company} · {type} Round
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
                >
                  Exit Simulation
                </button>
              </div>

              {/* Dialogue Log */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                {chat.map((msg, idx) => {
                  const isInterviewer = msg.role === 'interviewer';
                  return (
                    <div key={idx} className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
                      <div className="flex gap-2.5 max-w-[85%]">
                        {isInterviewer && (
                          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-750 text-sm">
                            👔
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm shadow leading-relaxed whitespace-pre-wrap
                            ${isInterviewer
                              ? 'bg-slate-900 border border-slate-805 text-slate-200 rounded-tl-none'
                              : 'bg-indigo-600 text-white rounded-tr-none'}`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* AI thinking state */}
                {sending && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%]">
                      <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-750 text-sm">
                        👔
                      </span>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Evaluation generating spinner */}
                {evaluating && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%]">
                      <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-750 text-sm">
                        👔
                      </span>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <span className="text-xs text-slate-400">Recruiters analyzing your performance scorecard…</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Error display */}
              {error && (
                <div className="px-5 py-2.5 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Bottom input area */}
              <div className="shrink-0 bg-slate-900 border-t border-slate-800 p-4">
                {status === 'completed' ? (
                  <div className="bg-indigo-600/10 border border-indigo-500/25 rounded-xl p-4 text-center space-y-3">
                    <div>
                      <p className="text-indigo-400 font-bold text-sm">✓ Mock Interview Concluded</p>
                      <p className="text-xs text-slate-400 leading-normal max-w-md mx-auto mt-0.5">
                        Your dialogue is locked. Run AI evaluation to analyze your responses and get specific, recruiter-level tips.
                      </p>
                    </div>
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <button
                        onClick={handleEvaluate}
                        disabled={evaluating}
                        className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-indigo-900/20"
                      >
                        ✨ Get AI Evaluation
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={evaluating}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-750"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendAnswer} className="flex gap-3">
                    <input
                      id="interview-answer-input"
                      type="text"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Provide your answer here…"
                      disabled={sending || evaluating}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={sending || evaluating || !answerInput.trim()}
                      className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition duration-150"
                    >
                      Submit
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
