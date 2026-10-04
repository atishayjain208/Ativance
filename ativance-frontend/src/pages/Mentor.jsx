import { useState, useEffect, useRef } from 'react';
import { Bot, Send, RefreshCw, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { getMentorHistory, chatWithMentor } from '../services/authService';

export default function Mentor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);

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

    const optimisticMessage = { role: 'user', message: text, timestamp: new Date() };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const data = await chatWithMentor(text);
      setMessages(data.chat || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((m) => m !== optimisticMessage));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-9.5rem)] flex flex-col bg-[#141821] border border-[#1F2633] rounded-2xl shadow-card overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#1F2633] bg-[#0F1219] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#22D3EE] p-[1px] shadow-glow-purple flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-[#0F1219] rounded-[11px] flex items-center justify-center">
              <Bot className="h-5 w-5 text-[#22D3EE]" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-[#F8FAFC] leading-tight flex items-center gap-2">
              <span>AI Career Mentor</span>
              <span className="text-[10px] font-semibold text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-full border border-[#22D3EE]/20">
                GPT-4 Turbo
              </span>
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Personalized guidance on roadmap goals, technical interview prep, and career strategy.
            </p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl hover:bg-[#181D27] border border-transparent hover:border-[#1F2633] transition"
          title="Refresh Conversation"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#7C5CFC]' : ''}`} />
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#090B10]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <RefreshCw className="h-6 w-6 text-[#7C5CFC] animate-spin" />
            <p className="text-xs font-semibold text-[#94A3B8]">Loading conversation history…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 max-w-sm mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-[#141821] border border-[#1F2633] shadow-card flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-[#7C5CFC]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#F8FAFC]">Start the conversation</p>
              <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
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
                      <div className="shrink-0 h-7 w-7 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-xs mt-0.5 shadow-sm">
                        <Bot className="h-4 w-4 text-[#22D3EE]" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-card leading-relaxed whitespace-pre-wrap
                        ${isUser
                          ? 'bg-[#7C5CFC] text-white rounded-tr-sm'
                          : 'bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] rounded-tl-sm'}`}
                    >
                      {msg.message}
                      <span
                        className={`block text-[10px] mt-1.5 text-right font-medium
                          ${isUser ? 'text-[#E2D9FF]' : 'text-[#64748B]'}`}
                      >
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="flex gap-2.5 max-w-[85%] sm:max-w-[75%]">
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-xs mt-0.5">
                    <Bot className="h-4 w-4 text-[#22D3EE]" />
                  </div>
                  <div className="bg-[#181D27] border border-[#1F2633] rounded-2xl rounded-tl-sm px-4 py-3 shadow-card flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#7C5CFC] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[#22D3EE] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[#34D399] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="shrink-0 px-4 py-2.5 bg-[#F87171]/10 border-t border-[#F87171]/20 text-[#F87171] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSend} className="shrink-0 p-4 bg-[#0F1219] border-t border-[#1F2633] flex gap-3">
        <input
          id="chat-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your career goals, resume, or DSA strategy…"
          disabled={loading || sending}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition text-sm shadow-soft disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || sending || !input.trim()}
          className="px-5 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-glow-purple"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
