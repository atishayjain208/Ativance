import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Search, AlertCircle, AlertTriangle, Sparkles, CheckCircle2, Clock, ExternalLink, Code2 } from 'lucide-react';
import { analyzeGithub } from '../services/authService';

const GithubIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const BAR_COLOURS = [
  '#7C5CFC', '#34D399', '#FBBF24', '#F87171',
  '#22D3EE', '#9B7CFF', '#F97316', '#10B981',
];

const TIER_META = {
  very_active: { label: 'Very Active', colour: 'text-[#34D399]', bg: 'bg-[#34D399]/10', border: 'border-[#34D399]/20', dot: 'bg-[#34D399]' },
  active:      { label: 'Active',      colour: 'text-[#34D399]', bg: 'bg-[#34D399]/10', border: 'border-[#34D399]/20', dot: 'bg-[#34D399]' },
  moderate:    { label: 'Moderate',    colour: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/10', border: 'border-[#FBBF24]/20', dot: 'bg-[#FBBF24]' },
  inactive:    { label: 'Inactive',    colour: 'text-[#F87171]', bg: 'bg-[#F87171]/10', border: 'border-[#F87171]/20', dot: 'bg-[#F87171]' },
  no_data:     { label: 'No data',     colour: 'text-[#94A3B8]', bg: 'bg-[#181D27]',    border: 'border-[#1F2633]',    dot: 'bg-[#64748B]' },
};

function SectionCard({ title, children, icon: Icon }) {
  return (
    <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 sm:p-6 space-y-4 shadow-card">
      <h2 className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
        {Icon && <Icon className="h-4 w-4 text-[#7C5CFC]" />}
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

function ProfileStrip({ stats }) {
  const tier = TIER_META[stats.commitConsistency?.activityTier] ?? TIER_META.no_data;

  return (
    <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-card">
      <img
        src={stats.avatarUrl}
        alt={stats.username}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-[#7C5CFC]/30 shadow-glow-purple shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-base sm:text-lg font-bold text-[#F8FAFC] truncate">
          {stats.name || stats.username}
        </p>
        <a
          href={`https://github.com/${stats.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#7C5CFC] hover:text-[#9B7CFF] flex items-center gap-1 mt-0.5"
        >
          @{stats.username} <ExternalLink className="h-3 w-3" />
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
          <div key={label} className="bg-[#181D27] border border-[#1F2633] rounded-xl px-3 py-2">
            <p className="text-sm font-bold text-[#F8FAFC]">{value}</p>
            <p className="text-[10px] font-medium text-[#64748B] mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LangTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#181D27] border border-[#1F2633] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] shadow-card">
      <p className="font-bold">{payload[0].payload.lang}</p>
      <p className="text-[#94A3B8]">{payload[0].value}% of codebase</p>
    </div>
  );
}

function LanguageChart({ distribution }) {
  const chartData = Object.entries(distribution)
    .slice(0, 10)
    .map(([lang, pct]) => ({ lang, pct }));

  if (!chartData.length) {
    return <p className="text-xs text-[#64748B]">No language data available.</p>;
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis
            type="number" domain={[0, 100]} unit="%"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#1F2633' }} tickLine={false}
          />
          <YAxis
            type="category" dataKey="lang" width={88}
            tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#1F2633' }} tickLine={false}
          />
          <Tooltip content={<LangTooltip />} cursor={{ fill: '#181D27' }} />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLOURS[i % BAR_COLOURS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1F2633]">
        {chartData.map(({ lang, pct }, i) => (
          <span
            key={lang}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181D27] border border-[#1F2633] text-xs font-medium text-[#94A3B8]"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: BAR_COLOURS[i % BAR_COLOURS.length] }}
            />
            <span>{lang}</span>
            <span className="text-[#64748B] font-normal">({pct}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function MissingDocsList({ reposMissingReadme, reposMissingDescription }) {
  const noReadme = reposMissingReadme      ?? [];
  const noDesc   = reposMissingDescription ?? [];

  if (!noReadme.length && !noDesc.length) {
    return (
      <div className="p-3.5 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-xs font-semibold text-[#34D399] flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        All analyzed repositories have README files and descriptions. Excellent repository hygiene!
      </div>
    );
  }

  const Section = ({ title, items, colourBadge }) =>
    items.length ? (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">{title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colourBadge}`}>
            {items.length} repos
          </span>
        </div>
        <ul className="space-y-1.5">
          {items.map(({ name, url }) => (
            <li key={name} className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64748B] shrink-0" />
              <a
                href={url} target="_blank" rel="noopener noreferrer"
                className="font-medium text-[#94A3B8] hover:text-[#7C5CFC] flex items-center gap-1 transition-colors truncate"
              >
                {name} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <Section title="Missing README" items={noReadme} colourBadge="bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20" />
      <Section title="Missing Description" items={noDesc} colourBadge="bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20" />
    </div>
  );
}

function SuggestionsList({ suggestions }) {
  if (!suggestions?.length) {
    return <p className="text-xs text-[#64748B]">No AI suggestions available.</p>;
  }

  return (
    <ul className="space-y-3">
      {suggestions.map((s, i) => (
        <li key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#181D27] border border-[#1F2633]">
          <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-[#7C5CFC] text-white text-xs font-bold shadow-glow-purple">
            {i + 1}
          </span>
          <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed pt-0.5">{s}</p>
        </li>
      ))}
    </ul>
  );
}

export default function GitHub() {
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">GitHub Insights</h1>
        <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
          Inspect public repositories, language breakdown, documentation health, and get AI tips to polish your portfolio.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 sm:p-6 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]">
              <GithubIcon className="h-4 w-4 text-[#7C5CFC]" />
            </span>
            <input
              id="github-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds)"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition text-sm shadow-soft disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2 shrink-0 shadow-glow-purple"
          >
            {loading ? (
              <span>Analyzing…</span>
            ) : (
              <span>Analyze Profile</span>
            )}
          </button>
        </div>

        {loading && (
          <p className="text-xs text-[#94A3B8] flex items-center gap-2 pt-1">
            <Sparkles className="h-3.5 w-3.5 text-[#22D3EE] animate-spin" />
            Fetching public repositories, analyzing commit metadata, and generating AI insights…
          </p>
        )}
      </form>

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warning && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] text-xs font-medium">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {result && (
        <div className="space-y-5 animate-fadeIn">
          <ProfileStrip stats={result} />

          <SectionCard title="Language Breakdown" icon={Code2}>
            {result.languageDistribution && Object.keys(result.languageDistribution).length ? (
              <LanguageChart distribution={result.languageDistribution} />
            ) : (
              <p className="text-xs text-[#64748B]">No language data found.</p>
            )}
          </SectionCard>

          {result.commitConsistency && (
            <SectionCard title="Commit Frequency & Recency" icon={Clock}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Latest Push',  value: result.commitConsistency.daysSinceLatestPush != null ? `${result.commitConsistency.daysSinceLatestPush}d ago` : '—' },
                  { label: 'Updated (30d)', value: result.commitConsistency.reposUpdatedLast30Days },
                  { label: 'Updated (90d)', value: result.commitConsistency.reposUpdatedLast90Days },
                  { label: 'Activity Tier', value: (
                    <span className={TIER_META[result.commitConsistency.activityTier]?.colour ?? 'text-[#94A3B8]'}>
                      {TIER_META[result.commitConsistency.activityTier]?.label ?? '—'}
                    </span>
                  )},
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#181D27] border border-[#1F2633] rounded-xl px-3 py-3">
                    <p className="text-sm font-bold text-[#F8FAFC]">{value}</p>
                    <p className="text-[10px] font-medium text-[#64748B] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Documentation Quality" icon={CheckCircle2}>
            <MissingDocsList
              reposMissingReadme={result.reposMissingReadme}
              reposMissingDescription={result.reposMissingDescription}
            />
          </SectionCard>

          <SectionCard title="AI Profile Recommendations" icon={Sparkles}>
            <SuggestionsList suggestions={result.aiSuggestions} />
            {result.suggestionsGeneratedAt && (
              <p className="text-[11px] text-[#64748B] pt-1">
                Generated on {new Date(result.suggestionsGeneratedAt).toLocaleString()}
              </p>
            )}
          </SectionCard>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-2.5 text-xs sm:text-sm font-semibold text-[#F8FAFC] bg-[#181D27] hover:bg-[#1F2633] border border-[#1F2633] rounded-xl transition duration-150 shadow-soft disabled:opacity-50"
          >
            ↺ Re-run GitHub Analysis
          </button>
        </div>
      )}

      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 flex gap-4 items-start shadow-card">
        <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="text-xs text-[#94A3B8] space-y-1">
          <p className="font-bold text-[#F8FAFC] text-sm">GitHub API rate limit info</p>
          <p className="text-[#64748B] leading-relaxed">
            This module queries GitHub's public API endpoints (up to 60 requests/hour per IP). Profiles with large repository collections may utilize several rate-limit tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
