import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  FileText,
  Code2,
  MessageSquare,
  Map,
  Video,
  User,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const GithubIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
  },
  {
    to: '/resume',
    label: 'Resume Analyzer',
    icon: FileText,
  },
  {
    to: '/github',
    label: 'GitHub Insights',
    icon: GithubIcon,
  },
  {
    to: '/dsa',
    label: 'DSA Coach',
    icon: Code2,
  },
  {
    to: '/mentor',
    label: 'AI Career Mentor',
    icon: MessageSquare,
  },
  {
    to: '/roadmap',
    label: 'Weekly Roadmap',
    icon: Map,
  },
  {
    to: '/interview',
    label: 'Interview Simulator',
    icon: Video,
  },
  {
    to: '/profile',
    label: 'Profile & Goals',
    icon: User,
  },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  // Determine current page title
  const currentNav = NAV_ITEMS.find((item) => item.to === location.pathname);
  const pageTitle = currentNav ? currentNav.label : 'Dashboard';

  const notifications = [
    { id: 1, title: 'AI Analysis Ready', desc: 'Your ATS resume score updated to 82/100', time: '10m ago' },
    { id: 2, title: 'Weekly Roadmap Updated', desc: 'Day 4 task ready: Dynamic Programming', time: '1h ago' },
    { id: 3, title: 'GitHub Sync Complete', desc: 'Analyzed 12 repositories successfully', time: '3h ago' },
  ];

  return (
    <div className="flex h-screen bg-[#090B10] text-[#F8FAFC] overflow-hidden font-sans">
      {/* ── Mobile Sidebar Drawer Backdrop ─────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-[#0F1219] border-r border-[#1F2633] transition-all duration-300 ease-in-out shrink-0
          ${collapsed ? 'md:w-20' : 'md:w-64'}
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Logo & Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1F2633]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#22D3EE] p-[1px] shadow-glow-purple shrink-0">
              <div className="h-full w-full bg-[#0F1219] rounded-[11px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#22D3EE]" />
              </div>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold text-[#F8FAFC] tracking-tight leading-none truncate">
                  Ativance
                </span>
                <span className="text-[10px] font-semibold text-[#7C5CFC] tracking-wider uppercase mt-1 truncate">
                  AI Career Copilot
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181D27] rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {(!collapsed || mobileOpen) && (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              Main Platform
            </p>
          )}

          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#181D27] text-[#F8FAFC] font-semibold shadow-soft border border-[#1F2633]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181D27]/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Purple active indicator stripe on left */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#7C5CFC] rounded-r-full shadow-glow-purple" />
                  )}

                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? 'text-[#7C5CFC]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                    }`}
                  />

                  {(!collapsed || mobileOpen) && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}

          {/* Settings Nav Item */}
          <NavLink
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive && location.hash === '#settings'
                  ? 'bg-[#181D27] text-[#F8FAFC] font-semibold shadow-soft border border-[#1F2633]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181D27]/60'
              }`
            }
          >
            <Settings className="h-5 w-5 shrink-0 text-[#64748B] group-hover:text-[#94A3B8]" />
            {(!collapsed || mobileOpen) && <span className="truncate">Settings</span>}
          </NavLink>
        </nav>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden md:flex items-center justify-between p-3 border-t border-[#1F2633]">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 text-xs font-semibold text-[#64748B]">
              <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
              <span>Copilot Engine v2.4</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181D27] rounded-xl transition border border-[#1F2633] ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User Card at Bottom of Sidebar */}
        {(!collapsed || mobileOpen) && (
          <div className="p-3 border-t border-[#1F2633]">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141821] border border-[#1F2633]">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#6344E2] flex items-center justify-center text-[#F8FAFC] text-xs font-bold shrink-0 shadow-glow-purple">
                {(user.name?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#F8FAFC] truncate">{user.name || 'Bhavesh'}</p>
                <p className="text-[11px] text-[#64748B] truncate">{user.email || 'user@ativance.ai'}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-[#64748B] hover:text-[#F87171] hover:bg-[#181D27] rounded-lg transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#090B10]">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[#0F1219]/90 backdrop-blur-md border-b border-[#1F2633] sticky top-0 z-30">
          {/* Left: Mobile Toggle + Page Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181D27] rounded-xl border border-[#1F2633] transition"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-[#64748B]">Ativance</span>
              <span className="text-[#64748B]">/</span>
              <span className="font-semibold text-[#F8FAFC]">{pageTitle}</span>
            </div>
          </div>

          {/* Middle: Search input bar */}
          <div className="hidden lg:flex items-center relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features, modules, tips..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#141821] border border-[#1F2633] text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition shadow-soft"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#181D27] border border-[#1F2633] text-[10px] font-mono text-[#64748B]">
              /
            </kbd>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick AI status pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#181D27] border border-[#1F2633] text-xs font-semibold text-[#22D3EE]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Copilot Ready</span>
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181D27] rounded-xl border border-[#1F2633] transition"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#7C5CFC] shadow-glow-purple" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#141821] border border-[#1F2633] rounded-2xl shadow-card p-4 space-y-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F2633]">
                    <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                      Notifications
                    </span>
                    <span className="text-[10px] text-[#22D3EE] font-semibold">3 New</span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-[#F8FAFC]">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-[#64748B]">{n.time}</span>
                        </div>
                        <p className="text-xs text-[#94A3B8]">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#181D27] border border-transparent hover:border-[#1F2633] transition"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#22D3EE] flex items-center justify-center text-[#F8FAFC] text-xs font-bold shadow-sm">
                  {(user.name?.[0] || 'U').toUpperCase()}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-[#F8FAFC] truncate max-w-[100px]">
                  {user.name?.split(' ')[0] || 'Bhavesh'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#141821] border border-[#1F2633] rounded-2xl shadow-card p-2 space-y-1 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-[#1F2633]">
                    <p className="text-xs font-bold text-[#F8FAFC] truncate">{user.name || 'Bhavesh'}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{user.email || 'user@ativance.ai'}</p>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#181D27] rounded-xl transition"
                  >
                    <User className="h-4 w-4 text-[#7C5CFC]" />
                    Profile & Goals
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F87171] hover:bg-[#181D27] rounded-xl transition text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page body content container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#090B10]">
          {children}
        </main>
      </div>
    </div>
  );
}