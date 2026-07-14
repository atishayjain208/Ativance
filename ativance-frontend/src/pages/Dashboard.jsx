const MODULE_CARDS = [
  {
    title: 'Resume Analyzer',
    description: 'Upload your resume and get an AI-powered score, strengths, and actionable improvements.',
    to: '/resume',
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/15',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    badge: 'Coming soon',
  },
  {
    title: 'GitHub Analyzer',
    description: 'Connect your GitHub profile and let AI assess your code quality and project health.',
    to: '/github',
    color: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/15',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    badge: 'Coming soon',
  },
  {
    title: 'DSA Coach',
    description: 'Track your LeetCode progress, identify weak topics, and get targeted problem recommendations.',
    to: '/dsa',
    color: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    badge: 'Coming soon',
  },
  {
    title: 'AI Career Mentor',
    description: 'Chat with your personal AI mentor for career advice, goal-setting, and strategy planning.',
    to: '/mentor',
    color: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    badge: 'Coming soon',
  },
  {
    title: 'Weekly Roadmap',
    description: 'Get a personalized, AI-generated weekly study plan aligned with your target companies and goals.',
    to: '/roadmap',
    color: 'from-pink-500/20 to-pink-600/5',
    border: 'border-pink-500/20',
    iconBg: 'bg-pink-500/15',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    badge: 'Coming soon',
  },
  {
    title: 'Interview Simulator',
    description: 'Practice mock interviews with real-time AI feedback on your answers and communication.',
    to: '/interview',
    color: 'from-cyan-500/20 to-cyan-600/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/15',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    badge: 'Coming soon',
  },
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Hero greeting ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {user.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Here's a look at what Ativance has in store for you.
        </p>
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Modules', value: '6' },
          { label: 'DSA Solved', value: '—' },
          { label: 'Roadmap', value: '—' },
          { label: 'Mentor Chats', value: '—' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-center"
          >
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Module cards grid ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_CARDS.map(({ title, description, color, border, iconBg, icon, badge }) => (
            <div
              key={title}
              className={`relative bg-gradient-to-br ${color} border ${border} rounded-2xl p-5 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 cursor-default`}
            >
              {/* Badge */}
              <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5">
                {badge}
              </span>

              {/* Icon */}
              <div className={`${iconBg} rounded-xl w-11 h-11 flex items-center justify-center`}>
                {icon}
              </div>

              {/* Text */}
              <div className="space-y-1 pr-12">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
