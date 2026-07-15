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
    <div className="max-w-3xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-indigo-400">🤖</span> AI Career Mentor
          </h1>
          <p className="text-xs text-slate-400">
            Ask questions about career direction, learning paths, resume edits, or interview tips.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Refresh Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
          </svg>
        </button>
      </div>

      {/* ── Chat Messages Container ── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <svg className="animate-spin h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-xs text-slate-500">Loading conversation history…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl">
              👋
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Start the conversation</p>
              <p className="text-xs text-slate-500 mt-1">
                Say hi to your AI Career Mentor! Ask about target companies, technical skills, or resume feedback.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed whitespace-pre-wrap
                      ${isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'}`}
                  >
                    {msg.message}
                    <span
                      className={`block text-[9px] mt-1 text-right leading-none
                        ${isUser ? 'text-indigo-200' : 'text-slate-500'}`}
                    >
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI thinking state */}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-md flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="shrink-0 mb-3 flex items-start gap-2.5 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Input Box ── */}
      <form onSubmit={handleSend} className="shrink-0 pt-3 border-t border-slate-800 flex gap-3">
        <input
          id="chat-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about resumes, interviews, or study plans…"
          disabled={loading || sending}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || sending || !input.trim()}
          className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition duration-150 flex items-center justify-center gap-2"
        >
          Send
        </button>
      </form>
    </div>
  );
}
