/**
 * dsaPrompt.js
 *
 * Builds the Gemini prompt for per-topic practice problem recommendations.
 */

/**
 * buildDSAProblemPrompt(topic, count, threshold)
 *
 * Returns a prompt instructing Gemini to act as a DSA coach and recommend
 * 8–12 well-known practice problems for a specific weak topic.
 *
 * The response must be a JSON array of { title, difficulty, topic, slug } objects.
 * slug is the exact LeetCode URL slug (lowercase-hyphenated) for the problem,
 * as used in https://leetcode.com/problems/{slug}/
 *
 * @param {string} topic      Canonical topic name (e.g. "Dynamic Programming")
 * @param {number} count      How many the user has already solved
 * @param {number} threshold  The "solid" baseline for this topic
 * @returns {string}          Fully assembled prompt string
 */
const buildDSAProblemPrompt = (topic, count, threshold) => {
  if (!topic || typeof topic !== 'string') {
    throw new Error('topic must be a non-empty string.');
  }

  const gap       = Math.max(0, threshold - count);
  const level     =
    count === 0      ? 'complete beginner (0 problems solved)'
    : count < 4      ? 'early beginner'
    : count < threshold / 2 ? 'beginner-intermediate'
    : 'intermediate (close to solid)';

  return `You are an expert competitive programming coach and DSA interview preparation mentor.

A student preparing for software engineering interviews has flagged "${topic}" as a weak area.
Their current progress: ${count} problems solved (target: ${threshold} to be considered "solid").
That leaves a gap of ${gap} more problems. Their current level on this topic: ${level}.

Recommend 8 to 12 specific, well-known practice problems on the topic of "${topic}" that would be most beneficial for this student to solve next, given their current level.

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON array of objects.
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.
3. Do NOT add any explanation, greeting, or summary outside the JSON.
4. Return EXACTLY 8 to 12 items in the array — no more, no less.
5. Each object must have exactly these four string fields: "title", "difficulty", "topic", "slug".
6. "difficulty" must be exactly one of: "Easy", "Medium", or "Hard" (capitalised exactly as shown).
7. "topic" must be exactly "${topic}" for every item.
8. "slug" must be the exact LeetCode URL slug for that problem — the lowercase-hyphenated identifier used in https://leetcode.com/problems/{slug}/. For example, "two-sum" for "Two Sum", or "find-if-path-exists-in-graph" for "Find if Path Exists in Graph". Generate slugs that exactly match the LeetCode problem URL.
9. Problems must be real, well-known LeetCode problems that the student can look up by name and slug.
10. Mix difficulties appropriately for the student's level — if they are a beginner, lean toward Easy/Medium.
11. Do NOT repeat the same problem twice.

Required JSON schema (return exactly this structure, no extra fields):
[
  { "title": "Two Sum", "difficulty": "Easy", "topic": "${topic}", "slug": "two-sum" },
  ...
]

Return ONLY the JSON array. No other text.`;
};

module.exports = { buildDSAProblemPrompt };
