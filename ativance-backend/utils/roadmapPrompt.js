/**
 * roadmapPrompt.js
 *
 * Builds Gemini prompts for generating study roadmaps.
 * Supports three generation modes:
 *   - "profile"  — personalised 7-day plan from the student's profile / weak areas
 *   - "company"  — deadline-driven plan targeting a specific company's interview style
 *   - "topic"    — focused N-day plan drilling a single custom topic
 */

// ── Company emphasis hints ────────────────────────────────────────────────────
// Maps well-known company names (lower-cased) to a one-line blurb about what
// their interview process typically emphasises.  New companies can be added here.
const COMPANY_HINTS = {
  google:     'Google is known for heavy emphasis on DSA (graphs, dynamic programming, system design at senior level), and clean algorithmic problem-solving with complexity analysis.',
  amazon:     'Amazon focuses on Leadership Principles (behavioural questions) in every round, combined with strong DSA (trees, graphs, arrays) and object-oriented design.',
  microsoft:  'Microsoft tests DSA fundamentals thoroughly (arrays, strings, trees) alongside system design for senior roles, with collaborative problem-solving and code quality.',
  meta:        'Meta (Facebook) emphasises DSA (arrays, graphs, DP) and a system design round for most roles, plus behavioural questions tied to their core values.',
  apple:       'Apple values deep domain knowledge, clean code quality, and practical system/product design, along with solid DSA.',
  netflix:     'Netflix focuses on system design (scalability, distributed systems), strong CS fundamentals, and cultural-fit / behavioural rounds.',
  uber:        'Uber prioritises DSA (graphs for routing, distributed systems), backend system design, and problem decomposition skills.',
  tcs:         'TCS tests CS fundamentals (OOPs, DBMS, OS, networking basics), aptitude, and coding basics — often with a verbal and aptitude test round.',
  infosys:     'Infosys evaluates aptitude, logical reasoning, basic coding, and CS fundamentals (DBMS, networking, OOPs) along with an HR round.',
  wipro:       'Wipro focuses on aptitude, reasoning, basic coding in popular languages, and CS fundamentals (DBMS, OS) plus a communication/HR round.',
  cognizant:   'Cognizant tests aptitude, verbal ability, basic coding, and CS fundamentals, with a strong HR/behavioural component.',
  accenture:   'Accenture emphasises aptitude, verbal reasoning, situational judgement, and a coding round testing basic data structures and problem-solving.',
  capgemini:   'Capgemini rounds cover aptitude, pseudocode / logical reasoning, basic coding, and an HR / communication interview.',
  hcl:         'HCL evaluates aptitude, reasoning, basic coding, and domain knowledge (DBMS, networking, OS) along with a personality / HR round.',
};

/**
 * getCompanyHint(companyName)
 * Returns a known emphasis blurb for the company, or a generic fallback.
 * @param {string} companyName
 * @returns {string}
 */
const getCompanyHint = (companyName) => {
  const key = (companyName || '').toLowerCase().trim();
  return (
    COMPANY_HINTS[key] ||
    `${companyName} typically runs a mix of DSA, CS fundamentals, and behavioural / HR rounds — weight the plan accordingly based on publicly known information about this company's hiring process.`
  );
};

// ── Shared JSON schema instruction block ──────────────────────────────────────
const jsonSchemaBlock = (n) => `
CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON array of objects.
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.
3. Do NOT add any explanation, greeting, or summary outside the JSON.
4. Return EXACTLY ${n} objects in the array — one for each day (Day 1 through Day ${n}).
5. Each object must have exactly these three string fields: "day", "focusArea", "task".
6. "day" must be labeled sequentially: "Day 1", "Day 2", ..., "Day ${n}".
7. Each task must be specific and actionable — never vague.

Required JSON schema (return exactly this structure, no extra fields):
[
  { "day": "Day 1", "focusArea": "DSA: Arrays", "task": "Study sliding window pattern and solve 2 easy LeetCode problems on arrays." },
  ...
]

Return ONLY the JSON array. No other text.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE: "profile"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildProfileRoadmapPrompt(userContext, weakDSA, weakResume)
 *
 * Generates a personalised 7-day study plan based on the student's profile,
 * weak DSA topics, and resume weak points.
 *
 * @param {string}        userContext  Compact student profile summary
 * @param {Array<string>} weakDSA      Weak DSA topics
 * @param {Array<string>} weakResume   Resume weak points
 * @returns {string}
 */
const buildProfileRoadmapPrompt = (userContext, weakDSA = [], weakResume = []) => {
  const dsaLine    = weakDSA.length    ? weakDSA.join(', ')    : 'None detected';
  const resumeLine = weakResume.length ? weakResume.join(', ') : 'None detected';

  return `You are an expert career advisor and technical training coordinator.
Your task is to generate a custom, highly focused 7-day weekly study roadmap for a student.

Here is the student's background context:
---
${userContext}
---

Prioritised areas for improvement this week:
- Weak DSA Topics: ${dsaLine}
- Resume Weak Points: ${resumeLine}

Create a balanced, day-by-day plan of exactly 7 days. Each day should target a single specific,
manageable task (e.g., studying a specific pattern, solving 2 practice problems on a weak topic,
or editing a specific resume section). Do not give vague tasks.
Focus areas may include: "DSA: [Topic]", "Resume Revision", "GitHub Portfolio", or "Career Prep".
${jsonSchemaBlock(7)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: "company"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildCompanyRoadmapPrompt(userContext, weakDSA, targetCompany, daysCount, truncated)
 *
 * Generates a deadline-aware plan targeting a specific company's interview style.
 * `daysCount` is the number of days shown (capped at MAX_PLAN_DAYS).
 * If `truncated` is true an extra note is prepended explaining the cap.
 *
 * @param {string}        userContext    Compact student profile summary
 * @param {Array<string>} weakDSA        Weak DSA topics from the student's profile
 * @param {string}        targetCompany  Name of the target company
 * @param {number}        daysCount      Number of days to include in the plan
 * @param {boolean}       truncated      Whether the real gap was longer than daysCount
 * @returns {string}
 */
const buildCompanyRoadmapPrompt = (
  userContext,
  weakDSA = [],
  targetCompany,
  daysCount,
  truncated = false,
) => {
  const companyHint = getCompanyHint(targetCompany);
  const dsaLine     = weakDSA.length ? weakDSA.join(', ') : 'None identified yet';
  const truncNote   = truncated
    ? `NOTE: The student's actual test date is more than ${daysCount} days away. ` +
      `This plan covers the next ${daysCount} days; a fresh plan can be generated later for the remaining period.\n\n`
    : '';

  return `${truncNote}You are an expert technical interview coach.
Your task is to create a targeted, day-by-day interview preparation plan for a student who has a ${targetCompany} interview/test coming up in ${daysCount} day${daysCount !== 1 ? 's' : ''}.

About ${targetCompany}'s interview process:
${companyHint}

Student's background context:
---
${userContext}
---

Student's current weak DSA areas (incorporate these early in the plan where relevant):
${dsaLine}

Design a ${daysCount}-day preparation plan that:
1. Front-loads the student's weak DSA areas and the topics ${targetCompany} is known to emphasise.
2. Progresses logically — foundational topics first, harder/integrative topics later.
3. Includes a mock interview or full revision day near the end if time permits.
4. Gives specific, actionable daily tasks (e.g., "Solve 3 medium graph problems on LeetCode" or "Read STAR-method guide and write 2 Leadership Principle stories for Amazon").
Focus areas may include: "DSA: [Topic]", "System Design", "Behavioural / HR", "CS Fundamentals", "Mock Interview", or "Revision".
${jsonSchemaBlock(daysCount)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: "topic"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildTopicRoadmapPrompt(customTopic, daysCount)
 *
 * Generates a focused plan drilling a single user-specified topic.
 *
 * @param {string} customTopic  The topic to cover (e.g. "System Design", "Dynamic Programming")
 * @param {number} daysCount    Number of days for the plan (defaults to 7)
 * @returns {string}
 */
const buildTopicRoadmapPrompt = (customTopic, daysCount = 7) => {
  return `You are an expert technical trainer and curriculum designer.
Your task is to create a focused, ${daysCount}-day deep-dive study plan on the topic: "${customTopic}".

Design this plan as a logical, progressive curriculum that:
1. Starts with core concepts and fundamentals on Day 1.
2. Builds incrementally — each day's task should follow naturally from the previous one.
3. Introduces practical exercises, problems, or projects in later days once fundamentals are solid.
4. Ends with an integrative exercise, mock problem set, or mini-project that demonstrates mastery.

The plan should be self-contained and independent of any other weak areas — focus exclusively on "${customTopic}".
Each day must have a single, specific, actionable task.
Focus areas should reflect sub-topics within "${customTopic}" (e.g. for "System Design": "System Design: Scalability", "System Design: Database Choices", etc.).
${jsonSchemaBlock(daysCount)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy alias (kept for any existing callers)
// ─────────────────────────────────────────────────────────────────────────────
const buildWeeklyRoadmapPrompt = buildProfileRoadmapPrompt;

module.exports = {
  buildWeeklyRoadmapPrompt,   // legacy alias → profile mode
  buildProfileRoadmapPrompt,
  buildCompanyRoadmapPrompt,
  buildTopicRoadmapPrompt,
  getCompanyHint,             // exported for tests / debugging
};
