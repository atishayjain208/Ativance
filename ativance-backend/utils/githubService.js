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

module.exports = {
  fetchUserRepos,
  fetchUserProfile,
  GITHUB_ERRORS,
};
