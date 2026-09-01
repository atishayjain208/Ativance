import { useState, useRef, useEffect } from 'react';
import { startInterview, nextInterviewQuestion, evaluateInterview } from '../services/authService';

const PRESETS = ['Google', 'Amazon', 'Microsoft', 'Flipkart', 'Meta', 'Netflix'];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components for Evaluation Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function ScoreCard({ label, score, colorClass }) {
  const widthPct = `${(score / 10) * 100}%`;
  return (
    <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 flex flex-col gap-1.5 shadow-soft">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="text-xl font-extrabold text-zinc-900">{score}<span className="text-xs text-zinc-400 font-normal">/10</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden mt-1">
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
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-6 text-center space-y-2 shadow-soft">
        <p className="text-emerald-800 font-bold text-base">🎉 Interview Performance Evaluated</p>
        <p className="text-xs text-emerald-700/90 max-w-md mx-auto leading-relaxed">
          AI simulated a recruiter evaluation on technical depth, communication clarity, and confidence.
        </p>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScoreCard label="Technical Depth" score={technicalDepth} colorClass="bg-indigo-600" />
        <ScoreCard label="Communication" score={communication} colorClass="bg-emerald-500" />
        <ScoreCard label="Confidence" score={confidence} colorClass="bg-amber-500" />
      </div>

      {/* Actionable Tips Card */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 space-y-4 shadow-soft">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <span>💡</span> Question-by-Question Recruiter Feedback
        </h3>

        <div className="space-y-3.5">
          {tips.map((item, idx) => (
            <div key={idx} className="bg-zinc-50/80 border border-zinc-200/70 rounded-xl p-4 space-y-2">
              <div className="flex gap-2.5 items-start">
                <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-zinc-200 text-[10px] font-bold text-zinc-700 mt-0.5">
                  Q{idx + 1}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-800 leading-relaxed">
                  {item.question}
                </p>
              </div>
              <div className="border-t border-zinc-200/60 pt-2 flex gap-2 items-start text-xs text-zinc-600 leading-relaxed pl-7">
                <span className="text-indigo-600 font-bold shrink-0">Tip:</span>
                <p>{item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={onExit}
        className="w-full py-3 bg-[#171717] hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm"
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Interview Simulator</h1>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">
          Practice dynamic tech and behavioral rounds with realistic recruiter follow-ups.
        </p>
      </div>

      {/* ── Setup Mode (before session starts) ── */}
      {!sessionId && (
        <form onSubmit={handleStart} className="bg-white border border-[#E5E5E0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-soft">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Configure Mock Session</h2>

          {/* Company Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">Target Company</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => { setCompany(p); setError(''); }}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all duration-150
                    ${company === p
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-soft'
                      : 'bg-white border-[#E5E5E0] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setCompany('Other'); setError(''); }}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all duration-150
                  ${company === 'Other'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-soft'
                    : 'bg-white border-[#E5E5E0] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'}`}
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
                placeholder="Enter company name (e.g. Stripe, Notion)"
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E0] text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-soft"
              />
            )}
          </div>

          {/* Interview Type */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">Round Format</label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Technical', 'HR', 'Behavioral'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all duration-150
                    ${type === t
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-soft'
                      : 'bg-white border-[#E5E5E0] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-[#171717] hover:bg-black disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span>Entering lobby and initializing session…</span>
              </>
            ) : '🎬 Launch Mock Interview'}
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
            <div className="flex flex-col h-[calc(100vh-13rem)] bg-white border border-[#E5E5E0] rounded-2xl overflow-hidden shadow-card animate-fadeIn">
              {/* Header Banner */}
              <div className="shrink-0 bg-white border-b border-[#E5E5E0] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mock Session Live</p>
                  <p className="text-sm font-bold text-zinc-900 mt-0.5">
                    {company === 'Other' ? customCompany : company} · {type} Round
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 border border-[#E5E5E0] hover:border-zinc-300 text-zinc-700 text-xs font-semibold rounded-xl transition shadow-soft"
                >
                  End Session
                </button>
              </div>

              {/* Dialogue Log */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAF9F6]">
                {chat.map((msg, idx) => {
                  const isInterviewer = msg.role === 'interviewer';
                  return (
                    <div key={idx} className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
                      <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                        {isInterviewer && (
                          <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-xs mt-0.5">
                            👔
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-soft leading-relaxed whitespace-pre-wrap
                            ${isInterviewer
                              ? 'bg-white border border-[#E5E5E0] text-zinc-800 rounded-tl-sm'
                              : 'bg-[#171717] text-white rounded-tr-sm'}`}
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
                    <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                      <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-xs mt-0.5">
                        👔
                      </span>
                      <div className="bg-white border border-[#E5E5E0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Evaluation generating spinner */}
                {evaluating && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                      <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-xs mt-0.5">
                        👔
                      </span>
                      <div className="bg-white border border-[#E5E5E0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <span className="text-xs text-zinc-500">Recruiters analyzing responses and scoring technical metrics…</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Error display */}
              {error && (
                <div className="px-5 py-2.5 bg-rose-50 border-t border-rose-200/80 text-rose-700 text-xs flex gap-2 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Bottom input area */}
              <div className="shrink-0 bg-white border-t border-[#E5E5E0] p-4">
                {status === 'completed' ? (
                  <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-5 text-center space-y-3 shadow-soft">
                    <div>
                      <p className="text-indigo-900 font-bold text-sm">✓ Mock Interview Completed</p>
                      <p className="text-xs text-indigo-700/80 max-w-md mx-auto mt-0.5 leading-normal">
                        Your dialogue is concluded. Generate an AI evaluation report to see your technical depth, communication, and question-by-question tips.
                      </p>
                    </div>
                    <div className="flex gap-2.5 max-w-sm mx-auto">
                      <button
                        onClick={handleEvaluate}
                        disabled={evaluating}
                        className="flex-1 py-2.5 px-4 bg-[#171717] hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
                      >
                        ✨ Generate Performance Scorecard
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={evaluating}
                        className="py-2.5 px-4 bg-white hover:bg-zinc-50 border border-[#E5E5E0] text-zinc-700 rounded-xl text-xs font-semibold transition shadow-soft"
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
                      placeholder="Type your response to the interviewer…"
                      disabled={sending || evaluating}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E0] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-sm shadow-soft disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={sending || evaluating || !answerInput.trim()}
                      className="px-6 bg-[#171717] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl transition duration-150 shadow-sm"
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
