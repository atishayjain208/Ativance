import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  FileText,
  Code2,
  MessageSquare,
  Map,
  Video,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Award,
  ChevronRight,
} from 'lucide-react';
import { getDSAProgress, getRoadmap, getMentorHistory } from '../services/authService';

const GithubIcon = ({ className = "h-5 w-5", style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const MODULE_CARDS = [
  {
    title: 'Resume Analyzer',
    description: 'Upload your resume and get an AI-powered score, strengths, and actionable improvements.',
    to: '/resume',
    accentColor: '#7C5CFC',
    icon: FileText,
    tag: 'ATS Optimization',
  },
  {
    title: 'GitHub Insights',
    description: 'Connect your GitHub profile and let AI assess your code quality and project health.',
    to: '/github',
    accentColor: '#22D3EE',
    icon: GithubIcon,
    tag: 'Portfolio Health',
  },
  {
    title: 'DSA Coach',
    description: 'Track your LeetCode progress, identify weak topics, and get targeted problem recommendations.',
    to: '/dsa',
    accentColor: '#34D399',
    icon: Code2,
    tag: 'Interview Prep',
  },
  {
    title: 'AI Career Mentor',
    description: 'Chat with your personal AI mentor for career advice, goal-setting, and strategy planning.',
    to: '/mentor',
    accentColor: '#FBBF24',
    icon: MessageSquare,
    tag: '24/7 AI Advice',
  },
  {
    title: 'Weekly Roadmap',
    description: 'Get a personalized, AI-generated weekly study plan aligned with your target companies and goals.',
    to: '/roadmap',
    accentColor: '#F87171',
    icon: Map,
    tag: 'Adaptive Plan',
  },
  {
    title: 'Interview Simulator',
    description: 'Practice mock interviews with real-time AI feedback on your answers and communication.',
    to: '/interview',
    accentColor: '#9B7CFF',
    icon: Video,
    tag: 'Mock Rounds',
  },
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = user.name?.split(' ')[0] || 'Bhavesh';

  // Live stats from API
  const [dsaSolved, setDsaSolved] = useState(null);
  const [roadmapTasks, setRoadmapTasks] = useState(null);
  const [completedRoadmapTasks, setCompletedRoadmapTasks] = useState(0);
  const [mentorChats, setMentorChats] = useState(null);

  useEffect(() => {
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
        const done = items.filter((it) => it.completed).length;
        setCompletedRoadmapTasks(done);
      })
      .catch(() => {
        setRoadmapTasks(0);
        setCompletedRoadmapTasks(0);
      });

    getMentorHistory()
      .then((data) => {
        const msgs = data?.chat || [];
        const userMsgs = msgs.filter((m) => m.role === 'user').length;
        setMentorChats(userMsgs);
      })
      .catch(() => setMentorChats(0));
  }, []);

  const fmt = (val) => (val === null ? '—' : String(val));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* ── Hero Greeting Section ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#141821] border border-[#1F2633] p-6 sm:p-8 shadow-card">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#7C5CFC]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181D27] border border-[#1F2633] text-xs font-semibold text-[#22D3EE]">
              <Sparkles className="h-3.5 w-3.5 text-[#22D3EE]" />
              <span>AI Career Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-[#94A3B8] text-xs sm:text-sm max-w-xl leading-relaxed">
              Your AI-powered career preparation overview. Here is your real-time breakdown of interview readiness, coding progress, and study roadmap.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#181D27] hover:bg-[#1F2633] border border-[#1F2633] text-xs font-semibold text-[#F8FAFC] rounded-xl transition duration-150 shadow-soft"
            >
              <Target className="h-4 w-4 text-[#7C5CFC]" />
              Edit Target Roles & Goals
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Career Readiness Score */}
        <div className="bg-[#141821] border border-[#1F2633] hover:border-[#2E384D] rounded-2xl p-5 shadow-card transition duration-200 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Career Readiness
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC] group-hover:scale-105 transition">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">78</span>
              <span className="text-xs text-[#64748B] font-semibold">/ 100</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">Combined prep strength score</p>
          </div>
          <div className="pt-2 border-t border-[#1F2633] flex items-center justify-between text-xs font-medium">
            <span className="text-[#34D399] flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> +4% this week
            </span>
            <span className="text-[#64748B]">High Potential</span>
          </div>
        </div>

        {/* 2. Resume Score */}
        <div className="bg-[#141821] border border-[#1F2633] hover:border-[#2E384D] rounded-2xl p-5 shadow-card transition duration-200 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Resume ATS Score
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] group-hover:scale-105 transition">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">82</span>
              <span className="text-xs text-[#64748B] font-semibold">/ 100</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">ATS keyword alignment</p>
          </div>
          <div className="pt-2 border-t border-[#1F2633] flex items-center justify-between text-xs font-medium">
            <span className="text-[#34D399] flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> ATS Verified
            </span>
            <span className="text-[#64748B]">PDF Analyzed</span>
          </div>
        </div>

        {/* 3. DSA Progress */}
        <div className="bg-[#141821] border border-[#1F2633] hover:border-[#2E384D] rounded-2xl p-5 shadow-card transition duration-200 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              DSA Solved
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center text-[#34D399] group-hover:scale-105 transition">
              <Code2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">{fmt(dsaSolved)}</span>
              <span className="text-xs text-[#64748B] font-semibold">problems</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">Total questions solved</p>
          </div>
          <div className="pt-2 border-t border-[#1F2633] flex items-center justify-between text-xs font-medium">
            <span className="text-[#34D399] flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" /> Active Streak
            </span>
            <span className="text-[#64748B]">LeetCode Synced</span>
          </div>
        </div>

        {/* 4. Roadmap Progress */}
        <div className="bg-[#141821] border border-[#1F2633] hover:border-[#2E384D] rounded-2xl p-5 shadow-card transition duration-200 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Roadmap Status
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24] group-hover:scale-105 transition">
              <Map className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                {completedRoadmapTasks}/{fmt(roadmapTasks)}
              </span>
              <span className="text-xs text-[#64748B] font-semibold">tasks</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">Weekly roadmap completion</p>
          </div>
          <div className="pt-2 border-t border-[#1F2633] flex items-center justify-between text-xs font-medium">
            <span className="text-[#22D3EE] flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> On Schedule
            </span>
            <span className="text-[#64748B]">Adaptive Plan</span>
          </div>
        </div>
      </div>

      {/* ── Preparation Modules Grid ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            AI Preparation Modules
          </h2>
          <span className="text-xs text-[#22D3EE] font-semibold">6 Modules Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULE_CARDS.map(({ title, description, accentColor, icon: Icon, to, tag }) => (
            <Link
              key={title}
              to={to}
              className="group relative bg-[#141821] border border-[#1F2633] hover:border-[#2E384D] rounded-2xl p-6 flex flex-col justify-between gap-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-hover shadow-card"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className="rounded-xl w-10 h-10 flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105"
                    style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#181D27] border border-[#1F2633] text-[#94A3B8]">
                    {tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#F8FAFC] group-hover:text-[#7C5CFC] transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F2633] flex items-center justify-between text-xs font-semibold text-[#94A3B8] group-hover:text-[#22D3EE] transition-colors">
                <span>Open module</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
