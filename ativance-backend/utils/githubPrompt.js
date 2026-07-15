/**
 * githubPrompt.js
 *
 * Builds the Gemini prompt for GitHub profile improvement suggestions.
 * Sends only the aggregated summary — never the full raw repo list — to
 * keep the prompt concise and the response focused.
 */

/**
 * buildGithubSuggestionsPrompt(stats)
 *
 * Constructs a prompt that instructs Gemini to act as a senior engineering
 * career coach and return exactly 3–4 specific, actionable improvements for
 * the developer's GitHub profile.
 *
 * JSON-only enforcement follows the same pattern as buildResumeAnalysisPrompt:
 *   - Stated once in the instructions
 *   - Reinforced in the schema definition
 *   - Repeated at the very end
 *
 * @param {object} stats  The aggregated summary object from aggregateGithubStats()
 * @returns {string}      The fully assembled prompt string
 */
const buildGithubSuggestionsPrompt = (stats) => {
  if (!stats || typeof stats !== 'object') {
    throw new Error('A valid GitHub stats summary object is required.');
  }

  // Build a compact, human-readable summary section to inject into the prompt.
  // We deliberately exclude repoDetails (the full per-repo array) to keep the
  // prompt short and avoid hitting token limits.
  const topLangs = stats.topLanguages?.join(', ') || 'unknown';

  const langDist = stats.languageDistribution
    ? Object.entries(stats.languageDistribution)
        .slice(0, 6)
        .map(([lang, pct]) => `${lang} (${pct}%)`)
        .join(', ')
    : 'No language data';

  const consistency = stats.commitConsistency || {};
  const activityLine =
    `Activity tier: ${consistency.activityTier || 'unknown'} | ` +
    `Days since latest push: ${consistency.daysSinceLatestPush ?? 'N/A'} | ` +
    `Repos updated in last 30 days: ${consistency.reposUpdatedLast30Days ?? 0} | ` +
    `Repos updated in last 90 days: ${consistency.reposUpdatedLast90Days ?? 0}`;

  const missingReadmeCount      = stats.reposMissingReadme?.length      ?? 0;
  const missingDescriptionCount = stats.reposMissingDescription?.length ?? 0;

  const summaryBlock = `
GitHub username      : ${stats.username}
Public repos (total) : ${stats.publicReposTotal}
Analyzed repos       : ${stats.analyzedRepos} (own, non-forked)
Forked repos         : ${stats.forkedRepos}
Top languages        : ${topLangs}
Language distribution: ${langDist}
Commit consistency   : ${activityLine}
Repos missing README : ${missingReadmeCount}
Repos missing desc.  : ${missingDescriptionCount}
`.trim();

  return `You are a senior software engineering career coach who reviews GitHub profiles to help developers land better jobs or internships.

Analyse the following aggregated GitHub profile summary and provide 3 to 4 specific, actionable suggestions that would most meaningfully improve this developer's GitHub profile or coding habits.

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON array of strings.
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.
3. Do NOT add any explanation, greeting, or summary outside the JSON.
4. Return EXACTLY 3 or 4 items in the array — no more, no less.
5. Each suggestion must be specific and actionable (e.g., "Add a README to your 'portfolio-site' repo explaining the tech stack and how to run it locally" is good; "Add READMEs" is too vague).
6. Base your suggestions only on the data provided — do not invent facts about repos not mentioned.

GitHub profile summary:
---
${summaryBlock}
---

Required response format (a JSON array of strings, nothing else):
["Suggestion one.", "Suggestion two.", "Suggestion three."]

Return ONLY the JSON array. No other text.`;
};

module.exports = { buildGithubSuggestionsPrompt };
