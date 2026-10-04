import { useState, useRef, useEffect } from 'react';
import { Video, Sparkles, Send, CheckCircle2, Award, AlertCircle, Building2, UserCheck, RefreshCw } from 'lucide-react';
import { startInterview, nextInterviewQuestion, evaluateInterview } from '../services/authService';

const PRESETS = ['Google', 'Amazon', 'Microsoft', 'Flipkart', 'Meta', 'Netflix'];

function ScoreCard({ label, score, colorClass }) {
  const widthPct = `${(score / 10) * 100}%`;
  return (
    <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 flex flex-col gap-1.5 shadow-card">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{label}</span>
        <span className="text-xl font-extrabold text-[#F8FAFC]">{score}<span className="text-xs text-[#64748B] font-normal">/10</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#181D27] overflow-hidden mt-1">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: widthPct }} />
      </div>
    </div>
  );
}

function EvaluationSummary({ evaluation, onExit }) {
  const { technicalDepth, communication, confidence, tips } = evaluation;

  return (
    <div className="space-y-6 animate-fadeIn py-2 pb-12">
      <div className="bg-[#34D399]/10 border border-[#34D399]/20 rounded-2xl p-6 text-center space-y-2 shadow-card">
        <p className="text-[#34D399] font-bold text-base flex items-center justify-center gap-2">
          <Award className="h-5 w-5" />
          <span>Interview Performance Evaluated</span>
        </p>
        <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
          AI simulated a recruiter evaluation on technical depth, communication clarity, and confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScoreCard label="Technical Depth" score={technicalDepth} colorClass="bg-[#7C5CFC]" />
        <ScoreCard label="Communication" score={communication} colorClass="bg-[#34D399]" />
        <ScoreCard label="Confidence" score={confidence} colorClass="bg-[#FBBF24]" />
      </div>

      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 space-y-4 shadow-card">
        <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#22D3EE]" />
          <span>Question-by-Question Recruiter Feedback</span>
        </h3>

        <div className="space-y-3.5">
          {tips.map((item, idx) => (
            <div key={idx} className="bg-[#181D27] border border-[#1F2633] rounded-xl p-4 space-y-2">
              <div className="flex gap-2.5 items-start">
                <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-[#1F2633] text-[10px] font-bold text-[#22D3EE] mt-0.5">
                  Q{idx + 1}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-[#F8FAFC] leading-relaxed">
                  {item.question}
                </p>
              </div>
              <div className="border-t border-[#1F2633] pt-2 flex gap-2 items-start text-xs text-[#94A3B8] leading-relaxed pl-7">
                <span className="text-[#7C5CFC] font-bold shrink-0">Tip:</span>
                <p>{item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onExit}
        className="w-full py-3 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] text-white text-xs sm:text-sm font-bold rounded-xl shadow-glow-purple transition"
      >
        Exit Interview Lobby
      </button>
    </div>
  );
}

export default function Interview() {
  const [company, setCompany] = useState('Google');
  const [customCompany, setCustomCompany] = useState('');
  const [type, setType] = useState('Technical');
  const [sessionId, setSessionId] = useState(null);

  const [chat, setChat] = useState([]);
  const [answerInput, setAnswerInput] = useState('');
  const [status, setStatus] = useState(null);

  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, sending, evaluating]);

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

  const handleSendAnswer = async (e) => {
    e.preventDefault();
    const text = answerInput.trim();
    if (!text || sending || !sessionId) return;

    setAnswerInput('');
    setSending(true);
    setError('');

    const optAnswer = { role: 'candidate', message: text, timestamp: new Date() };
    setChat((prev) => [...prev, optAnswer]);

    try {
      const data = await nextInterviewQuestion(sessionId, text);
      setStatus(data.status);
      setChat(data.chat || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send answer. Please try again.');
      setChat((prev) => prev.filter((c) => c !== optAnswer));
    } finally {
      setSending(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">Interview Simulator</h1>
        <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
          Practice dynamic tech and behavioral rounds with realistic recruiter follow-ups.
        </p>
      </div>

      {!sessionId && (
        <form onSubmit={handleStart} className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 sm:p-8 space-y-6 shadow-card">
          <h2 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#7C5CFC]" />
            Configure Mock Session
          </h2>

          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Target Company</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => { setCompany(p); setError(''); }}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all duration-150
                    ${company === p
                      ? 'bg-[#7C5CFC]/10 border-[#7C5CFC] text-[#7C5CFC] font-bold shadow-soft'
                      : 'bg-[#181D27] border-[#1F2633] text-[#94A3B8] hover:border-[#2E384D] hover:text-[#F8FAFC]'}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setCompany('Other'); setError(''); }}
                className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all duration-150
                  ${company === 'Other'
                    ? 'bg-[#7C5CFC]/10 border-[#7C5CFC] text-[#7C5CFC] font-bold shadow-soft'
                    : 'bg-[#181D27] border-[#1F2633] text-[#94A3B8] hover:border-[#2E384D] hover:text-[#F8FAFC]'}`}
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
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] placeholder:text-[#64748B] text-sm focus:outline-none focus:border-[#7C5CFC] shadow-soft"
              />
            )}
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Round Format</label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Technical', 'HR', 'Behavioral'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setType(t)}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all duration-150
                    ${type === t
                      ? 'bg-[#7C5CFC]/10 border-[#7C5CFC] text-[#7C5CFC] font-bold shadow-soft'
                      : 'bg-[#181D27] border-[#1F2633] text-[#94A3B8] hover:border-[#2E384D] hover:text-[#F8FAFC]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white font-bold rounded-xl shadow-glow-purple transition flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {loading ? (
              <span>Initializing simulation session…</span>
            ) : (
              <>
                <Video className="h-4 w-4" />
                <span>Launch Mock Interview</span>
              </>
            )}
          </button>
        </form>
      )}

      {sessionId && (
        <div className="space-y-6">
          {evaluation ? (
            <EvaluationSummary evaluation={evaluation} onExit={handleReset} />
          ) : (
            <div className="flex flex-col h-[calc(100vh-13rem)] bg-[#141821] border border-[#1F2633] rounded-2xl overflow-hidden shadow-card animate-fadeIn">
              <div className="shrink-0 bg-[#0F1219] border-b border-[#1F2633] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">Mock Session Live</p>
                  <p className="text-sm font-bold text-[#F8FAFC] mt-0.5">
                    {company === 'Other' ? customCompany : company} · {type} Round
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-1.5 bg-[#181D27] hover:bg-[#1F2633] border border-[#1F2633] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold rounded-xl transition shadow-soft"
                >
                  End Session
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#090B10]">
                {chat.map((msg, idx) => {
                  const isInterviewer = msg.role === 'interviewer';
                  return (
                    <div key={idx} className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
                      <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                        {isInterviewer && (
                          <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-xs mt-0.5">
                            <UserCheck className="h-4 w-4 text-[#22D3EE]" />
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-card leading-relaxed whitespace-pre-wrap
                            ${isInterviewer
                              ? 'bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] rounded-tl-sm'
                              : 'bg-[#7C5CFC] text-white rounded-tr-sm'}`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {sending && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                      <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-xs mt-0.5">
                        <UserCheck className="h-4 w-4 text-[#22D3EE]" />
                      </span>
                      <div className="bg-[#181D27] border border-[#1F2633] rounded-2xl rounded-tl-sm px-4 py-3 shadow-card flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#7C5CFC] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-[#22D3EE] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-[#34D399] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {evaluating && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                      <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-xs mt-0.5">
                        <UserCheck className="h-4 w-4 text-[#22D3EE]" />
                      </span>
                      <div className="bg-[#181D27] border border-[#1F2633] rounded-2xl rounded-tl-sm px-4 py-3 shadow-card flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-[#7C5CFC] animate-spin" />
                        <span className="text-xs text-[#94A3B8]">Recruiters analyzing responses and scoring technical metrics…</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {error && (
                <div className="px-5 py-2.5 bg-[#F87171]/10 border-t border-[#F87171]/20 text-[#F87171] text-xs flex gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="shrink-0 bg-[#0F1219] border-t border-[#1F2633] p-4">
                {status === 'completed' ? (
                  <div className="bg-[#181D27] border border-[#1F2633] rounded-2xl p-5 text-center space-y-3 shadow-card">
                    <div>
                      <p className="text-[#34D399] font-bold text-sm">✓ Mock Interview Completed</p>
                      <p className="text-xs text-[#94A3B8] max-w-md mx-auto mt-0.5 leading-normal">
                        Your dialogue is concluded. Generate an AI evaluation report to see your technical depth, communication, and question-by-question tips.
                      </p>
                    </div>
                    <div className="flex gap-2.5 max-w-sm mx-auto">
                      <button
                        onClick={handleEvaluate}
                        disabled={evaluating}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-glow-purple"
                      >
                        Generate Scorecard
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={evaluating}
                        className="py-2.5 px-4 bg-[#141821] hover:bg-[#181D27] border border-[#1F2633] text-[#94A3B8] rounded-xl text-xs font-semibold transition shadow-soft"
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
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition text-sm shadow-soft disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={sending || evaluating || !answerInput.trim()}
                      className="px-6 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition duration-150 shadow-glow-purple flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Submit</span>
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
