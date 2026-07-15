const User   = require('../models/User');
const { aggregateGithubStats, GITHUB_ERRORS }  = require('../utils/githubService');
const { generateContent, errorResponse: aiErrorResponse } = require('../utils/geminiClient');
const { buildGithubSuggestionsPrompt }         = require('../utils/githubPrompt');

// ── Helper: strip markdown fences (mirrors resumeController) ─────────────────
const stripFences = (raw) =>
  raw.trim()
     .replace(/^```(?:json)?\s*/i, '')
     .replace(/\s*```\s*$/, '')
     .trim();

// ── Friendly errors for GitHub API failures ───────────────────────────────────
const githubErrorResponse = (tag) => {
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

  // ── 1. Aggregate GitHub data ────────────────────────────────────────────────
  let githubStats;
  try {
    githubStats = await aggregateGithubStats(username.trim());
  } catch (err) {
    console.error(`[analyzeGithub] Aggregation failed for "${username}" (tag=${err._tag}):`, err.message);
    const { status, message } = githubErrorResponse(err._tag);
    return res.status(status).json({ success: false, message });
  }

  // ── 2. Build prompt and call Gemini for profile suggestions ─────────────────
  //    Non-fatal: if AI fails we still return the stats to the user.
  let suggestions = [];
  let suggestionsWarning = null;

  const prompt = buildGithubSuggestionsPrompt(githubStats);

  const tryParseArray = (raw) => {
    const parsed = JSON.parse(stripFences(raw));
    if (!Array.isArray(parsed)) throw new Error('Gemini response is not a JSON array.');
    if (parsed.length < 2 || parsed.length > 5) {
      throw new Error(`Expected 3–4 suggestions, got ${parsed.length}.`);
    }
    return parsed.filter((s) => typeof s === 'string' && s.trim());
  };

  let rawAI;
  try {
    rawAI = await generateContent(prompt);
  } catch (aiErr) {
    console.error(`[analyzeGithub] Gemini call failed (tag=${aiErr._tag}):`, aiErr.message);
    suggestionsWarning = aiErrorResponse(aiErr._tag || 'AI_ERROR').message;
  }

  if (rawAI) {
    // First parse attempt
    try {
      suggestions = tryParseArray(rawAI);
    } catch (_firstErr) {
      console.warn('[analyzeGithub] First AI parse failed — retrying with stricter prompt.');

      const retryPrompt =
        prompt +
        '\n\nIMPORTANT: Your previous response could not be parsed as a JSON array. ' +
        'Return ONLY a raw JSON array of strings with no markdown, no code fences, no extra text.';

      try {
        const retryRaw  = await generateContent(retryPrompt, { skipRetry: true });
        suggestions     = tryParseArray(retryRaw);
      } catch (retryErr) {
        console.error('[analyzeGithub] Retry AI parse also failed:', retryErr.message);
        suggestionsWarning = 'AI suggestions are temporarily unavailable. GitHub data was still saved.';
        suggestions = [];
      }
    }
  }

  // ── 3. Persist githubStats + suggestions to User document ───────────────────
  const statsToSave = {
    ...githubStats,
    aiSuggestions: suggestions,
    suggestionsGeneratedAt: suggestions.length ? new Date() : null,
  };

  try {
    await User.findByIdAndUpdate(
      req.user.id,
      { $set: { githubStats: statsToSave } },
      { new: true }
    );
  } catch (dbErr) {
    console.error('[analyzeGithub] Failed to save to DB:', dbErr.message);
    // Non-fatal — continue to respond
  }

  // ── 4. Respond ──────────────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    message: `GitHub profile for "${githubStats.username}" analyzed successfully.`,
    githubStats:  statsToSave,
    warning:      suggestionsWarning || undefined,
  });
};

module.exports = { analyzeGithub };
