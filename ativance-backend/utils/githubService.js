/**
 * githubService.js
 *
 * Fetches public GitHub data using the unauthenticated GitHub REST API v3.
 *
 * ⚠️  RATE LIMIT NOTE:
 *   Unauthenticated requests share a limit of 60 requests/hour per originating
 *   IP address (https://docs.github.com/en/rest/using-the-rest-api/rate-limits).
 *   For the MVP this is acceptable. When traffic grows, add a GitHub Personal
 *   Access Token via GITHUB_TOKEN in .env and pass it as:
 *     headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
 *   which raises the limit to 5,000 requests/hour.
 */

const GITHUB_API   = 'https://api.github.com';
const TIMEOUT_MS   = 10_000; // abort if GitHub is slow
const MAX_REPOS    = 100;    // GitHub's per_page maximum

// ── Typed error tags ──────────────────────────────────────────────────────────
const GITHUB_ERRORS = {
  NOT_FOUND:    'GITHUB_NOT_FOUND',
  RATE_LIMITED: 'GITHUB_RATE_LIMITED',
  NETWORK:      'GITHUB_NETWORK',
  API_ERROR:    'GITHUB_API_ERROR',
};

/**
 * Build a typed Error so callers can branch on err._tag without string matching.
 */
const makeError = (tag, message) => {
  const err  = new Error(message);
  err._tag   = tag;
  return err;
};

/**
 * githubFetch(path)
 *
 * Thin fetch wrapper with:
 *   - AbortController timeout
 *   - User-Agent header (required by GitHub API)
 *   - Typed error classification
 *
 * @param {string} path  Path relative to https://api.github.com, e.g. '/users/torvalds/repos'
 * @returns {Promise<any>}  Parsed JSON body
 */
const githubFetch = async (path) => {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      signal: controller.signal,
      headers: {
        Accept:       'application/vnd.github+json',
        'User-Agent': 'Ativance-App/1.0', // GitHub requires a UA string
        'X-GitHub-Api-Version': '2022-11-28',
        // Uncomment once GITHUB_TOKEN is added to .env:
        // ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
      },
    });
  } catch (fetchErr) {
    clearTimeout(timer);
    if (fetchErr.name === 'AbortError') {
      throw makeError(GITHUB_ERRORS.NETWORK, 'GitHub API request timed out. Please try again.');
    }
    throw makeError(GITHUB_ERRORS.NETWORK, 'Could not reach the GitHub API. Check your network connection.');
  }

  clearTimeout(timer);

  if (response.status === 404) {
    throw makeError(GITHUB_ERRORS.NOT_FOUND, 'GitHub username not found. Please check the username and try again.');
  }

  if (response.status === 403 || response.status === 429) {
    // X-RateLimit-Reset contains the Unix timestamp when the limit resets
    const resetAt = response.headers.get('X-RateLimit-Reset');
    const resetMsg = resetAt
      ? ` Resets at ${new Date(Number(resetAt) * 1000).toLocaleTimeString()}.`
      : '';
    throw makeError(
      GITHUB_ERRORS.RATE_LIMITED,
      `GitHub API rate limit reached (60 req/hour for unauthenticated access).${resetMsg} Please try again later.`
    );
  }

  if (!response.ok) {
    throw makeError(GITHUB_ERRORS.API_ERROR, `GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * fetchUserRepos(username)
 *
 * Returns all public repositories for a GitHub user, sorted by most recently
 * pushed (GitHub default). Requests the maximum 100 repos in one page; for
 * users with more than 100 repos, pagination can be added later.
 *
 * @param {string} username  GitHub username (case-insensitive)
 * @returns {Promise<Array>}  Array of GitHub repo objects
 * @throws  Error with ._tag set to one of GITHUB_ERRORS
 */
const fetchUserRepos = async (username) => {
  if (!username || !username.trim()) {
    throw makeError(GITHUB_ERRORS.API_ERROR, 'GitHub username is required.');
  }

  const clean = username.trim().toLowerCase();

  // Validate username format (GitHub usernames: alphanumeric + hyphens, 1–39 chars)
  if (!/^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$/i.test(clean)) {
    throw makeError(
      GITHUB_ERRORS.NOT_FOUND,
      'Invalid GitHub username format. Usernames can only contain alphanumeric characters and hyphens.'
    );
  }

  const repos = await githubFetch(
    `/users/${encodeURIComponent(clean)}/repos?per_page=${MAX_REPOS}&sort=pushed&direction=desc`
  );

  return repos; // raw GitHub repo objects array
};

/**
 * fetchUserProfile(username)
 *
 * Returns the public profile information for a GitHub user.
 *
 * @param {string} username
 * @returns {Promise<object>}  GitHub user object
 */
const fetchUserProfile = async (username) => {
  if (!username || !username.trim()) {
    throw makeError(GITHUB_ERRORS.API_ERROR, 'GitHub username is required.');
  }
  return githubFetch(`/users/${encodeURIComponent(username.trim())}`);
};

/**
 * fetchRepoLanguages(owner, repoName)
 *
 * Returns the language breakdown for a single repo as { language: bytes }.
 * e.g. { JavaScript: 42100, CSS: 3200 }
 *
 * Returns an empty object on 404 (empty/deleted repos) rather than throwing.
 *
 * @param {string} owner
 * @param {string} repoName
 * @returns {Promise<object>}
 */
const fetchRepoLanguages = async (owner, repoName) => {
  try {
    return await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/languages`);
  } catch (err) {
    // An individual repo's language endpoint 404ing is non-fatal
    if (err._tag === GITHUB_ERRORS.NOT_FOUND) return {};
    throw err;
  }
};

/**
 * checkReadme(owner, repoName)
 *
 * Returns true if the repo has a README file, false otherwise.
 * Uses a HEAD request (no body) to avoid wasting bandwidth.
 *
 * ⚠️  Each call counts as one API request against the rate limit.
 *
 * @param {string} owner
 * @param {string} repoName
 * @returns {Promise<boolean>}
 */
const checkReadme = async (owner, repoName) => {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/readme`,
      {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          Accept:       'application/vnd.github+json',
          'User-Agent': 'Ativance-App/1.0',
          'X-GitHub-Api-Version': '2022-11-28',
          // ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
        },
      }
    );
    clearTimeout(timer);
    return res.ok; // 200 → has README, 404 → missing
  } catch {
    clearTimeout(timer);
    return false; // treat fetch errors as "no README"
  }
};

/**
 * runWithConcurrency(tasks, limit)
 *
 * Runs an array of async task functions with at most `limit` in-flight at once.
 * This avoids firing 100 parallel requests and burning the rate limit instantly.
 *
 * @param {Array<() => Promise<any>>} tasks
 * @param {number} limit
 * @returns {Promise<Array<any>>}
 */
const runWithConcurrency = async (tasks, limit) => {
  const results = [];
  let index = 0;

  const worker = async () => {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  };

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
};

/**
 * aggregateGithubStats(username)
 *
 * Orchestrates the full GitHub analysis for a user:
 *   1. Fetch the user's public profile.
 *   2. Fetch all repos (up to 100).
 *   3. For each non-forked repo, fetch languages + check for README.
 *      (Runs with concurrency=5 to stay well within rate limits.)
 *   4. Aggregate into a clean summary object.
 *
 * ⚠️  RATE LIMIT BUDGET:
 *   Each call uses roughly: 1 (profile) + 1 (repos) + N*2 (languages + readme per repo)
 *   For a user with 20 repos: ~43 requests. The 60 req/hour unauthenticated limit
 *   means this can be called ~1–2 times per hour per server IP before it degrades.
 *   Add GITHUB_TOKEN to raise the ceiling to 5,000 req/hour.
 *
 * @param {string} username
 * @returns {Promise<object>}  Aggregated stats summary
 */
const aggregateGithubStats = async (username) => {
  // 1. Profile + repos in parallel (2 requests)
  const [profile, repos] = await Promise.all([
    fetchUserProfile(username),
    fetchUserRepos(username),
  ]);

  // 2. Work only on non-forked repos for language/readme enrichment
  //    (forked repos skew language counts and usually have READMEs upstream)
  const ownRepos = repos.filter((r) => !r.fork);

  // 3. Enrich each repo concurrently, max 5 at a time
  const enrichTasks = ownRepos.map((repo) => async () => {
    const [languages, hasReadme] = await Promise.all([
      fetchRepoLanguages(profile.login, repo.name),
      checkReadme(profile.login, repo.name),
    ]);
    return { repo, languages, hasReadme };
  });

  const enriched = await runWithConcurrency(enrichTasks, 5);

  // 4. Aggregate language totals (bytes per language across all repos)
  const languageTotals = {};
  for (const { languages } of enriched) {
    for (const [lang, bytes] of Object.entries(languages)) {
      languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
    }
  }

  // Sort languages by byte count descending → top languages first
  const totalLanguages = Object.fromEntries(
    Object.entries(languageTotals).sort(([, a], [, b]) => b - a)
  );

  // 5. Flag repos missing a description or README
  const reposMissingReadme = enriched
    .filter(({ hasReadme }) => !hasReadme)
    .map(({ repo }) => ({ name: repo.name, url: repo.html_url }));

  const reposMissingDescription = ownRepos
    .filter((r) => !r.description || r.description.trim() === '')
    .map((r) => ({ name: r.name, url: r.html_url }));

  // 6. Build the summary object
  const stats = {
    username:               profile.login,
    name:                   profile.name || '',
    avatarUrl:              profile.avatar_url,
    publicReposTotal:       profile.public_repos,   // total on GH profile (may exceed 100)
    analyzedRepos:          ownRepos.length,         // non-forked repos we actually analyzed
    forkedRepos:            repos.length - ownRepos.length,
    totalLanguages,                                  // { Language: totalBytes }
    topLanguages:           Object.keys(totalLanguages).slice(0, 5),
    reposMissingReadme,
    reposMissingDescription,
    repoDetails: enriched.map(({ repo, languages, hasReadme }) => ({
      name:        repo.name,
      url:         repo.html_url,
      description: repo.description || '',
      languages,
      hasReadme,
      stars:       repo.stargazers_count,
      updatedAt:   repo.pushed_at,
    })),
    syncedAt: new Date(),
  };

  return stats;
};

module.exports = {
  fetchUserRepos,
  fetchUserProfile,
  fetchRepoLanguages,
  checkReadme,
  aggregateGithubStats,
  GITHUB_ERRORS,
};
