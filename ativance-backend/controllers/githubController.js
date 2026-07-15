const User = require('../models/User');
const { aggregateGithubStats, GITHUB_ERRORS } = require('../utils/githubService');

// ── Friendly error messages for each typed tag ────────────────────────────────
const errorResponse = (tag) => {
  switch (tag) {
    case GITHUB_ERRORS.NOT_FOUND:
      return { status: 404, message: 'GitHub username not found. Please check the username and try again.' };
    case GITHUB_ERRORS.RATE_LIMITED:
      return { status: 429, message: 'GitHub API rate limit reached. Please try again in an hour, or add a GitHub token to raise the limit.' };
    case GITHUB_ERRORS.NETWORK:
      return { status: 502, message: 'Could not reach GitHub. Please check your connection and try again.' };
    default:
      return { status: 502, message: 'Failed to fetch GitHub data. Please try again.' };
  }
};

// ── GET /api/github/analyze/:username ─────────────────────────────────────────
const analyzeGithub = async (req, res) => {
  const { username } = req.params;

  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, message: 'GitHub username is required.' });
  }

  // ── 1. Run the full aggregation ─────────────────────────────────────────────
  let githubStats;
  try {
    githubStats = await aggregateGithubStats(username.trim());
  } catch (err) {
    console.error(`[analyzeGithub] Failed for "${username}" (tag=${err._tag}):`, err.message);
    const { status, message } = errorResponse(err._tag);
    return res.status(status).json({ success: false, message });
  }

  // ── 2. Persist to the logged-in user's document ─────────────────────────────
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      { $set: { githubStats } },
      { new: true }
    );
  } catch (dbErr) {
    // Non-fatal — data is valid, just failed to persist
    console.error('[analyzeGithub] Failed to save githubStats to DB:', dbErr.message);
  }

  // ── 3. Respond ──────────────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    message: `GitHub profile for "${githubStats.username}" analyzed successfully.`,
    githubStats,
  });
};

module.exports = { analyzeGithub };
