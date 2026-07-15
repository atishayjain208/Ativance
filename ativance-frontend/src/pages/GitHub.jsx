import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { analyzeGithub } from '../services/authService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BAR_COLOURS = [
  '#818cf8', '#34d399', '#fbbf24', '#f87171',
  '#38bdf8', '#a78bfa', '#fb923c', '#4ade80',
];

const TIER_META = {
  very_active: { label: 'Very Active',  colour: 'text-emerald-400', dot: 'bg-emerald-400' },
  active:      { label: 'Active',       colour: 'text-green-400',   dot: 'bg-green-400'   },
  moderate:    { label: 'Moderate',     colour: 'text-amber-400',   dot: 'bg-amber-400'   },
  inactive:    { label: 'Inactive',     colour: 'text-red-400',     dot: 'bg-red-400'     },
  no_data:     { label: 'No data',      colour: 'text-slate-400',   dot: 'bg-slate-500'   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ title, children, icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
        {icon && <span>{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Profile header strip ──────────────────────────────────────────────────────
function ProfileStrip({ stats }) {
  const tier = TIER_META[stats.commitConsistency?.activityTier] ?? TIER_META.no_data;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-5">
      <img
        src={stats.avatarUrl}
        alt={stats.username}
        className="w-16 h-16 rounded-full ring-2 ring-indigo-500/30"
      />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-white truncate">
          {stats.name || stats.username}
        </p>
        <a
          href={`https://github.com/${stats.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:underline"
        >
          @{stats.username}
        </a>
      </div>
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { label: 'Repos',    value: stats.publicReposTotal },
          { label: 'Analyzed', value: stats.analyzedRepos    },
          { label: 'Forks',    value: stats.forkedRepos      },
          { label: 'Activity', value: (
            <span className={`flex items-center justify-center gap-1 ${tier.colour}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${tier.dot}`} />
              {tier.label}
            </span>
          )},
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800 rounded-lg px-3 py-2">
            <p className="text-sm font-bold text-white">{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-lg">
      <p className="font-semibold">{payload[0].payload.lang}</p>
      <p className="text-slate-400">{payload[0].value}%</p>
    </div>
  );
}

// ── Language bar chart ────────────────────────────────────────────────────────
function LanguageChart({ distribution }) {
  const chartData = Object.entries(distribution)
    .slice(0, 10)
    .map(([lang, pct]) => ({ lang, pct }));

  if (!chartData.length) {
    return <p className="text-sm text-slate-500">No language data available.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Recharts bar */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis
            type="number" domain={[0, 100]} unit="%"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            type="category" dataKey="lang" width={88}
            tick={{ fill: '#cbd5e1', fontSize: 12 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<LangTooltip />} cursor={{ fill: '#1e293b' }} />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLOURS[i % BAR_COLOURS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Pill legend */}
      <div className="flex flex-wrap gap-2">
        {chartData.map(({ lang, pct }, i) => (
          <span
            key={lang}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: BAR_COLOURS[i % BAR_COLOURS.length] }}
            />
            {lang} — {pct}%
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
      <p className="text-sm text-emerald-400 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        All repos have a README and description — great work!
      </p>
    );
  }

  const Section = ({ title, items, colour }) =>
    items.length ? (
      <div className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wider ${colour}`}>{title} ({items.length})</p>
        <ul className="space-y-1.5">
          {items.map(({ name, url }) => (
            <li key={name} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0 mt-0.5" />
              <a
                href={url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-slate-300 hover:text-indigo-400 hover:underline transition-colors"
              >
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <Section title="Missing README"      items={noReadme} colour="text-red-400"   />
      <Section title="Missing description" items={noDesc}   colour="text-amber-400" />
    </div>
  );
}

// ── AI suggestions list ───────────────────────────────────────────────────────
function SuggestionsList({ suggestions }) {
  if (!suggestions?.length) {
    return <p className="text-sm text-slate-500">No AI suggestions available.</p>;
  }

  return (
    <ul className="space-y-3">
      {suggestions.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400 text-[11px] font-bold mt-0.5">
            {i + 1}
          </span>
          <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">GitHub Analyzer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Enter a GitHub username to analyze language distribution, documentation health, and get AI-powered profile improvement tips.
        </p>
      </div>

      {/* ── Search form ── */}
      <form onSubmit={handleAnalyze} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </span>
            <input
              id="github-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. torvalds"
              disabled={loading}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-150 flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing…
              </>
            ) : 'Analyze'}
          </button>
        </div>

        {/* Loading hint */}
        {loading && (
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <svg className="animate-spin h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Fetching repos and running AI analysis — this may take 15–30 seconds…
          </p>
        )}
      </form>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── AI warning (non-blocking) ── */}
      {warning && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {warning}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-5">
          {/* Profile strip */}
          <ProfileStrip stats={result} />

          {/* Language chart */}
          <SectionCard title="Language Distribution" icon="📊">
            {result.languageDistribution && Object.keys(result.languageDistribution).length ? (
              <LanguageChart distribution={result.languageDistribution} />
            ) : (
              <p className="text-sm text-slate-500">No language data found.</p>
            )}
          </SectionCard>

          {/* Activity summary */}
          {result.commitConsistency && (
            <SectionCard title="Commit Activity" icon="🕐">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Last push',  value: result.commitConsistency.daysSinceLatestPush != null ? `${result.commitConsistency.daysSinceLatestPush}d ago` : '—' },
                  { label: 'Updated (30d)', value: result.commitConsistency.reposUpdatedLast30Days },
                  { label: 'Updated (90d)', value: result.commitConsistency.reposUpdatedLast90Days },
                  { label: 'Status',    value: (
                    <span className={TIER_META[result.commitConsistency.activityTier]?.colour ?? 'text-slate-400'}>
                      {TIER_META[result.commitConsistency.activityTier]?.label ?? '—'}
                    </span>
                  )},
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800 rounded-xl px-3 py-3">
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Missing docs */}
          <SectionCard title="Documentation Health" icon="📄">
            <MissingDocsList
              reposMissingReadme={result.reposMissingReadme}
              reposMissingDescription={result.reposMissingDescription}
            />
          </SectionCard>

          {/* AI suggestions */}
          <SectionCard title="AI Profile Suggestions" icon="💡">
            <SuggestionsList suggestions={result.aiSuggestions} />
            {result.suggestionsGeneratedAt && (
              <p className="text-[10px] text-slate-600 pt-1">
                Generated {new Date(result.suggestionsGeneratedAt).toLocaleString()}
              </p>
            )}
          </SectionCard>

          {/* Re-analyze */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-xl transition-colors duration-150 disabled:opacity-50"
          >
            ↺ Re-analyze
          </button>
        </div>
      )}

      {/* Rate limit info card (always visible) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 flex gap-4 items-start">
        <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-sm text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">Rate limit notice</p>
          <p className="text-xs">
            This feature uses the unauthenticated GitHub API (60 requests/hour per IP).
            Analysis of a profile with many repos may use a significant portion of this limit.
            If you hit the limit, wait an hour and try again.
          </p>
        </div>
      </div>
    </div>
  );
}
