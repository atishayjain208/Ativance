/**
 * userContext.js
 *
 * Assembles a compact, human-readable summary of a student's profile for
 * injection into AI prompts (Mentor, Roadmap, Interview Simulator, etc.).
 *
 * Design constraints:
 *   - Output must be a short paragraph block, NOT a raw JSON dump.
 *   - Each section contributes one sentence maximum.
 *   - Missing / empty fields are skipped silently — no "N/A" noise.
 *   - Total target: < 120 tokens so the summary stays a small fraction of
 *     any model's context window even when combined with task-specific prompts.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return up to `n` items from an array, formatted as a comma-joined string. */
const joinTop = (arr, n) =>
  Array.isArray(arr) && arr.length ? arr.slice(0, n).join(', ') : null;

/** Trim and return a string, or null if empty / not a string. */
const str = (val) =>
  typeof val === 'string' && val.trim() ? val.trim() : null;

/**
 * buildUserContext(user, dsaProgress?)
 *
 * @param {object}  user         Mongoose User document (or plain object)
 * @param {object}  [dsaProgress] Optional DSAProgress document for the same user
 * @returns {string}             A compact multi-sentence context block, or a
 *                               generic fallback if the profile is mostly empty.
 */
const buildUserContext = (user, dsaProgress = null) => {
  if (!user || typeof user !== 'object') {
    return 'The student has not yet set up their profile.';
  }

  const lines = [];

  // ── 1. Identity & goals ───────────────────────────────────────────────────
  const namePart  = str(user.name) ? `${user.name} is` : 'The student is';
  const eduObj    = user.education || {};
  const degree    = str(eduObj.degree);
  const inst      = str(eduObj.institution);
  const year      = eduObj.graduationYear;
  const eduPart   =
    degree && inst ? `a ${degree} student at ${inst}${year ? ` (graduating ${year})` : ''}`
    : degree       ? `a ${degree} student`
    : inst         ? `a student at ${inst}`
    : null;

  if (eduPart) {
    lines.push(`${namePart} ${eduPart}.`);
  }

  const goals = str(user.goals);
  if (goals) lines.push(`Their goal: ${goals}.`);

  const targets = joinTop(user.targetCompanies, 3);
  if (targets) lines.push(`Target companies: ${targets}.`);

  const hours = user.availableStudyHours;
  if (typeof hours === 'number' && hours > 0) {
    lines.push(`Available study time: ${hours} hours/week.`);
  }

  // ── 2. Skills ─────────────────────────────────────────────────────────────
  const skills = joinTop(user.skills, 8);
  if (skills) lines.push(`Known skills: ${skills}.`);

  // ── 3. Resume intelligence ────────────────────────────────────────────────
  const ra = user.resumeAnalysis;
  if (ra) {
    if (typeof ra.atsScore === 'number') {
      lines.push(`Resume ATS score: ${ra.atsScore}/100.`);
    }

    // Top 2–3 weak points (most actionable signal for the AI)
    const weakPoints = joinTop(ra.weakPoints, 3);
    if (weakPoints) lines.push(`Resume weak points: ${weakPoints}.`);

    // Top 2–3 missing skills from resume perspective
    const missing = joinTop(ra.missingSkills, 3);
    if (missing) lines.push(`Skills missing from resume: ${missing}.`);
  }

  // ── 4. GitHub intelligence ────────────────────────────────────────────────
  const gh = user.githubStats;
  if (gh) {
    const langs = joinTop(gh.topLanguages, 3);
    const tier  = str(gh.commitConsistency?.activityTier);
    if (langs && tier) {
      lines.push(`GitHub: primary languages are ${langs}; activity level is ${tier}.`);
    } else if (langs) {
      lines.push(`GitHub primary languages: ${langs}.`);
    }

    // Top 2–3 AI suggestions (distilled insight, not raw repo lists)
    const ghSuggestions = joinTop(gh.aiSuggestions, 2);
    if (ghSuggestions) {
      lines.push(`GitHub improvement areas: ${ghSuggestions}.`);
    }
  }

  // ── 5. DSA Coach intelligence ─────────────────────────────────────────────
  const dsa = dsaProgress;
  if (dsa) {
    const d = dsa.solvedByDifficulty || {};
    const total = (d.easy || 0) + (d.medium || 0) + (d.hard || 0);
    if (total > 0) {
      lines.push(
        `DSA: ${total} problems solved (${d.easy || 0} easy, ${d.medium || 0} medium, ${d.hard || 0} hard).`
      );
    }

    const weak = joinTop(dsa.weakTopics, 3);
    if (weak) lines.push(`DSA weak areas: ${weak}.`);
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (!lines.length) {
    return 'The student has not yet provided profile details.';
  }

  return lines.join(' ');
};

module.exports = { buildUserContext };
