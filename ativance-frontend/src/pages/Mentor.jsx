import { useState, useEffect, useRef } from 'react';
import { getMentorHistory, chatWithMentor } from '../services/authService';

export default function Mentor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');

  const chatEndRef = useRef(null);

  // ── Load history on mount ───────────────────────────────────────────────────
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true); setError('');
    try {
      const data = await getMentorHistory();
      setMessages(data.chat || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chat history.');
    } finally {
      setLoading(false);
    }
  };

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    setError('');

    // Optimistically push the user message first
    const optimisticMessage = { role: 'user', message: text, timestamp: new Date() };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const data = await chatWithMentor(text);
      setMessages(data.chat || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
      // Remove optimistic message if sending fails to keep chat correct
      setMessages((prev) => prev.filter((m) => m !== optimisticMessage));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-9.5rem)] flex flex-col bg-white border border-[#E5E5E0] rounded-2xl shadow-soft overflow-hidden animate-fadeIn">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 border-b border-[#E5E5E0] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 leading-tight">
              AI Career Mentor
            </h1>
            <p className="text-xs text-zinc-500">
              Personalized guidance on roadmap goals, technical interview prep, and career strategy.
            </p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition"
          title="Refresh Conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
          </svg>
        </button>
      </div>

      {/* ── Chat Messages Container ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAF9F6]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-xs font-semibold text-zinc-500">Loading conversation history…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 max-w-sm mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-white border border-[#E5E5E0] shadow-soft flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Start the conversation</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Ask anything about breaking into tech roles, resume positioning, interview tactics, or recommended study topics.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%]`}>
                    {!isUser && (
                      <div className="shrink-0 h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs mt-0.5">
                        🤖
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-soft leading-relaxed whitespace-pre-wrap
                        ${isUser
                          ? 'bg-[#171717] text-white rounded-tr-sm'
                          : 'bg-white border border-[#E5E5E0] text-zinc-800 rounded-tl-sm'}`}
                    >
                      {msg.message}
                      <span
                        className={`block text-[10px] mt-1.5 text-right font-medium
                          ${isUser ? 'text-zinc-400' : 'text-zinc-400'}`}
                      >
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI thinking state */}
            {sending && (
              <div className="flex justify-start">
                <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs mt-0.5">
                    🤖
                  </div>
                  <div className="bg-white border border-[#E5E5E0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="shrink-0 px-4 py-2.5 bg-rose-50 border-t border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Input Box ── */}
      <form onSubmit={handleSend} className="shrink-0 p-4 bg-white border-t border-[#E5E5E0] flex gap-3">
        <input
          id="chat-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your career goals, resume, or DSA strategy…"
          disabled={loading || sending}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E0] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-sm shadow-soft disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || sending || !input.trim()}
          className="px-6 bg-[#171717] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
