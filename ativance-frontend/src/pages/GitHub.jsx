import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { analyzeGithub } from '../services/authService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BAR_COLOURS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
  '#0EA5E9', '#8B5CF6', '#F97316', '#22C55E',
];

const TIER_META = {
  very_active: { label: 'Very Active',  colour: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  active:      { label: 'Active',       colour: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200',   dot: 'bg-green-500'   },
  moderate:    { label: 'Moderate',     colour: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  inactive:    { label: 'Inactive',     colour: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500'     },
  no_data:     { label: 'No data',      colour: 'text-zinc-600',    bg: 'bg-zinc-50',    border: 'border-zinc-200',    dot: 'bg-zinc-400'   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ title, children, icon }) {
  return (
    <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-soft">
      <h2 className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase tracking-wider">
        {icon && <span className="text-sm">{icon}</span>}
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

// ── Profile header strip ──────────────────────────────────────────────────────
function ProfileStrip({ stats }) {
  const tier = TIER_META[stats.commitConsistency?.activityTier] ?? TIER_META.no_data;

  return (
    <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-soft">
      <img
        src={stats.avatarUrl}
        alt={stats.username}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ring-2 ring-indigo-500/20 shadow-sm shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-base sm:text-lg font-bold text-zinc-900 truncate">
          {stats.name || stats.username}
        </p>
        <a
          href={`https://github.com/${stats.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          @{stats.username} ↗
        </a>
      </div>
      <div className="w-full sm:w-auto shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        {[
          { label: 'Repos',    value: stats.publicReposTotal },
          { label: 'Analyzed', value: stats.analyzedRepos    },
          { label: 'Forks',    value: stats.forkedRepos      },
          { label: 'Activity', value: (
            <span className={`inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${tier.colour}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${tier.dot}`} />
              {tier.label}
            </span>
          )},
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 border border-zinc-200/60 rounded-xl px-3 py-2">
            <p className="text-sm font-bold text-zinc-900">{value}</p>
            <p className="text-[10px] font-medium text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recharts custom tooltip ───────────────────────────────────────────────────
function LangTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs text-zinc-900 shadow-card">
      <p className="font-bold">{payload[0].payload.lang}</p>
      <p className="text-zinc-500">{payload[0].value}% of codebase</p>
    </div>
  );
}

// ── Language bar chart ────────────────────────────────────────────────────────
function LanguageChart({ distribution }) {
  const chartData = Object.entries(distribution)
    .slice(0, 10)
    .map(([lang, pct]) => ({ lang, pct }));

  if (!chartData.length) {
    return <p className="text-xs text-zinc-500">No language data available.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Recharts bar */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis
            type="number" domain={[0, 100]} unit="%"
            tick={{ fill: '#71717A', fontSize: 11 }}
            axisLine={{ stroke: '#E5E5E0' }} tickLine={false}
          />
          <YAxis
            type="category" dataKey="lang" width={88}
            tick={{ fill: '#27272A', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#E5E5E0' }} tickLine={false}
          />
          <Tooltip content={<LangTooltip />} cursor={{ fill: '#F4F4F5' }} />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLOURS[i % BAR_COLOURS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Pill legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
        {chartData.map(({ lang, pct }, i) => (
          <span
            key={lang}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs font-medium text-zinc-700"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: BAR_COLOURS[i % BAR_COLOURS.length] }}
            />
            <span>{lang}</span>
            <span className="text-zinc-400 font-normal">({pct}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Missing docs list ─────────────────────────────────────────────────────────
function MissingDocsList({ reposMissingReadme, reposMissingDescription }) {
  const noReadme = reposMissingReadme      ?? [];
  const noDesc   = reposMissingDescription ?? [];

  if (!noReadme.length && !noDesc.length) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        All analyzed repositories have README files and descriptions. Excellent repository hygiene!
      </div>
    );
  }

  const Section = ({ title, items, colourBadge }) =>
    items.length ? (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">{title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colourBadge}`}>
            {items.length} repos
          </span>
        </div>
        <ul className="space-y-1.5">
          {items.map(({ name, url }) => (
            <li key={name} className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
              <a
                href={url} target="_blank" rel="noopener noreferrer"
                className="font-medium text-zinc-700 hover:text-indigo-600 hover:underline transition-colors truncate"
              >
                {name} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <Section title="Missing README" items={noReadme} colourBadge="bg-rose-50 text-rose-700 border border-rose-200/80" />
      <Section title="Missing Description" items={noDesc} colourBadge="bg-amber-50 text-amber-700 border border-amber-200/80" />
    </div>
  );
}

// ── AI suggestions list ───────────────────────────────────────────────────────
function SuggestionsList({ suggestions }) {
  if (!suggestions?.length) {
    return <p className="text-xs text-zinc-500">No AI suggestions available.</p>;
  }

  return (
    <ul className="space-y-3">
      {suggestions.map((s, i) => (
        <li key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
          <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
            {i + 1}
          </span>
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed pt-0.5">{s}</p>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function GitHub() {
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);   // githubStats object
  const [error, setError]       = useState('');
  const [warning, setWarning]   = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true); setResult(null); setError(''); setWarning('');

    try {
      const data = await analyzeGithub(trimmed);
      setResult(data.githubStats);
      if (data.warning) setWarning(data.warning);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">GitHub Insights</h1>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">
          Inspect public repositories, language breakdown, documentation health, and get AI tips to polish your portfolio.
        </p>
      </div>

      {/* ── Search form ── */}
      <form onSubmit={handleAnalyze} className="bg-white border border-[#E5E5E0] rounded-2xl p-5 sm:p-6 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </span>
            <input
              id="github-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds)"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E5E0] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-sm shadow-soft disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-6 py-2.5 bg-[#171717] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition duration-150 flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Analyzing…</span>
              </>
            ) : (
              'Analyze Profile'
            )}
          </button>
        </div>

        {/* Loading hint */}
        {loading && (
          <p className="text-xs text-zinc-500 flex items-center gap-1.5 pt-1">
            <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Fetching public repositories, analyzing commit metadata, and generating AI insights…
          </p>
        )}
      </form>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── AI warning (non-blocking) ── */}
      {warning && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>{warning}</span>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-5 animate-fadeIn">
          {/* Profile strip */}
          <ProfileStrip stats={result} />

          {/* Language chart */}
          <SectionCard title="Language Breakdown" icon="📊">
            {result.languageDistribution && Object.keys(result.languageDistribution).length ? (
              <LanguageChart distribution={result.languageDistribution} />
            ) : (
              <p className="text-xs text-zinc-500">No language data found.</p>
            )}
          </SectionCard>

          {/* Activity summary */}
          {result.commitConsistency && (
            <SectionCard title="Commit Frequency & Recency" icon="🕐">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Latest Push',  value: result.commitConsistency.daysSinceLatestPush != null ? `${result.commitConsistency.daysSinceLatestPush}d ago` : '—' },
                  { label: 'Updated (30d)', value: result.commitConsistency.reposUpdatedLast30Days },
                  { label: 'Updated (90d)', value: result.commitConsistency.reposUpdatedLast90Days },
                  { label: 'Activity Tier', value: (
                    <span className={TIER_META[result.commitConsistency.activityTier]?.colour ?? 'text-zinc-600'}>
                      {TIER_META[result.commitConsistency.activityTier]?.label ?? '—'}
                    </span>
                  )},
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zinc-50 border border-zinc-200/60 rounded-xl px-3 py-3">
                    <p className="text-sm font-bold text-zinc-900">{value}</p>
                    <p className="text-[10px] font-medium text-zinc-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Missing docs */}
          <SectionCard title="Documentation Quality" icon="📄">
            <MissingDocsList
              reposMissingReadme={result.reposMissingReadme}
              reposMissingDescription={result.reposMissingDescription}
            />
          </SectionCard>

          {/* AI suggestions */}
          <SectionCard title="AI Profile Recommendations" icon="💡">
            <SuggestionsList suggestions={result.aiSuggestions} />
            {result.suggestionsGeneratedAt && (
              <p className="text-[11px] text-zinc-400 pt-1">
                Generated on {new Date(result.suggestionsGeneratedAt).toLocaleString()}
              </p>
            )}
          </SectionCard>

          {/* Re-analyze */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#E5E5E0] hover:border-zinc-300 rounded-xl transition duration-150 shadow-soft disabled:opacity-50"
          >
            ↺ Re-run GitHub Analysis
          </button>
        </div>
      )}

      {/* Rate limit notice */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 flex gap-4 items-start shadow-soft">
        <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-xs text-zinc-600 space-y-1">
          <p className="font-bold text-zinc-900 text-sm">GitHub API rate limit info</p>
          <p className="text-zinc-500 leading-relaxed">
            This module queries GitHub's public API endpoints (up to 60 requests/hour per IP). Profiles with large repository collections may utilize several rate-limit tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
