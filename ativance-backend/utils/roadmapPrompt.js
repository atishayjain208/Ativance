/**
 * roadmapPrompt.js
 *
 * Builds the Gemini prompt for generating a weekly study roadmap.
 */

/**
 * buildWeeklyRoadmapPrompt(userContext, weakDSA, weakResume)
 *
 * Constructs a prompt for Gemini to act as a career coach and return a 7-day
 * study plan based on the student's profile context, weak DSA topics, and
 * resume weak points.
 *
 * Enforces JSON array output with exactly 7 items.
 *
 * @param {string}        userContext  Compact student profile summary string
 * @param {Array<string>} weakDSA      List of weak DSA topics
 * @param {Array<string>} weakResume   List of resume weak points
 * @returns {string}                   Assembled prompt
 */
const buildWeeklyRoadmapPrompt = (userContext, weakDSA = [], weakResume = []) => {
  const dsaLine    = weakDSA.length ? weakDSA.join(', ') : 'None detected';
  const resumeLine = weakResume.length ? weakResume.join(', ') : 'None detected';

  return `You are an expert career advisor and technical training coordinator.
Your task is to generate a custom, highly focused 7-day weekly study roadmap for a student.

Here is the student's background context:
---
${userContext}
---

Prioritized areas for improvement this week:
- Weak DSA Topics to focus on: ${dsaLine}
- Resume Weak Points to fix: ${resumeLine}

Create a balanced, day-by-day plan of exactly 7 days. Each day should target a single specific, manageable task (e.g., studying a specific pattern, solving 2 practice problems on a weak topic, or editing a specific resume section). Do not give vague tasks.

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON array of objects.
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.
3. Do NOT add any explanation, greeting, or summary outside the JSON.
4. Return EXACTLY 7 objects in the array — one for each day.
5. Each object must have exactly these three string fields: "day", "focusArea", "task".
6. "day" should be labeled sequentially: "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7".
7. Focus areas can include: "DSA: [Topic]", "Resume Revision", "GitHub Portfolio", or "Career Prep".

Required JSON schema (return exactly this structure, no extra fields):
[
  { "day": "Day 1", "focusArea": "DSA: Arrays", "task": "Study sliding window pattern and solve 2 easy problems." },
  ...
]

Return ONLY the JSON array. No other text.`;
};

module.exports = { buildWeeklyRoadmapPrompt };
