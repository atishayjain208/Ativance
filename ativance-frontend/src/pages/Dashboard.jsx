import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getDSAProgress, getRoadmap, getMentorHistory } from '../services/authService';

const MODULE_CARDS = [
  {
    title: 'Resume Analyzer',
    description: 'Upload your resume and get an AI-powered score, strengths, and actionable improvements.',
    to: '/resume',
    iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'GitHub Insights',
    description: 'Connect your GitHub profile and let AI assess your code quality and project health.',
    to: '/github',
    iconBg: 'bg-violet-50 text-violet-600 border border-violet-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    title: 'DSA Coach',
    description: 'Track your LeetCode progress, identify weak topics, and get targeted problem recommendations.',
    to: '/dsa',
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: 'AI Career Mentor',
    description: 'Chat with your personal AI mentor for career advice, goal-setting, and strategy planning.',
    to: '/mentor',
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'Weekly Roadmap',
    description: 'Get a personalized, AI-generated weekly study plan aligned with your target companies and goals.',
    to: '/roadmap',
    iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    title: 'Interview Simulator',
    description: 'Practice mock interviews with real-time AI feedback on your answers and communication.',
    to: '/interview',
    iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Live stats ─────────────────────────────────────────────────────────────
  const [dsaSolved,      setDsaSolved]      = useState(null);
  const [roadmapTasks,   setRoadmapTasks]   = useState(null);
  const [mentorChats,    setMentorChats]    = useState(null);

  useEffect(() => {
    // Fetch all three in parallel; ignore individual errors gracefully
    getDSAProgress()
      .then((data) => {
        const d = data?.progress?.solvedByDifficulty || {};
        const total = (d.easy || 0) + (d.medium || 0) + (d.hard || 0);
        setDsaSolved(total);
      })
      .catch(() => setDsaSolved(0));

    getRoadmap()
      .then((data) => {
        const items = data?.roadmap?.items || [];
        setRoadmapTasks(items.length);
      })
      .catch(() => setRoadmapTasks(0));

    getMentorHistory()
      .then((data) => {
        // chat array contains alternating user/AI messages; count user messages
        const msgs = data?.chat || [];
        const userMsgs = msgs.filter((m) => m.role === 'user').length;
        setMentorChats(userMsgs);
      })
      .catch(() => setMentorChats(0));
  }, []);

  // Format: show number if loaded, '—' while still fetching
  const fmt = (val) => (val === null ? '—' : String(val));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* ── Hero greeting ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            {greeting}, {user.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Here is an overview of your AI-guided career prep tools and progress.
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-50 border border-[#E5E5E0] text-xs font-semibold text-zinc-700 rounded-xl shadow-soft transition-all duration-150 self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Edit Target Roles & Goals
        </Link>
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Modules',  value: '6',               highlight: 'text-indigo-600' },
          { label: 'DSA Solved',      value: fmt(dsaSolved),    highlight: 'text-zinc-900'   },
          { label: 'Roadmap Tasks',   value: fmt(roadmapTasks), highlight: 'text-zinc-900'   },
          { label: 'Mentor Chats',    value: fmt(mentorChats),  highlight: 'text-zinc-900'   },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="bg-white border border-[#E5E5E0] rounded-2xl p-5 shadow-soft hover:shadow-card transition-all duration-150"
          >
            <p className={`text-2xl font-bold tracking-tight ${highlight}`}>{value}</p>
            <p className="text-xs font-medium text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Module cards grid ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Preparation Modules
          </h2>
          <span className="text-xs text-zinc-400">All tools ready</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULE_CARDS.map(({ title, description, iconBg, icon, to }) => (
            <Link
              key={title}
              to={to}
              className="group relative bg-white border border-[#E5E5E0] hover:border-zinc-300 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-hover shadow-soft"
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className={`rounded-xl w-10 h-10 flex items-center justify-center ${iconBg} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                  {icon}
                </div>

                {/* Text content */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Bottom launch link */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-600 group-hover:text-indigo-600 transition-colors">
                <span>Open module</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

