const User          = require('../models/User');
const DSAProgress   = require('../models/DSAProgress');
const WeeklyRoadmap = require('../models/WeeklyRoadmap');
const { buildUserContext }          = require('../utils/userContext');
const { generateContent }           = require('../utils/geminiClient');
const {
  buildProfileRoadmapPrompt,
  buildCompanyRoadmapPrompt,
  buildTopicRoadmapPrompt,
} = require('../utils/roadmapPrompt');

// ── Constants ─────────────────────────────────────────────────────────────────
/** Maximum number of days shown at once for the "company" mode. */
const MAX_PLAN_DAYS = 30;

/** Minimum days allowed for a company mode plan (guard against same-day dates). */
const MIN_PLAN_DAYS = 1;

// ── Helper: strip markdown fences (mirrors resume/github controllers) ─────────
const stripFences = (raw) =>
  raw.trim()
     .replace(/^```(?:json)?\s*/i, '')
     .replace(/\s*```\s*$/, '')
     .trim();

// ── Helper: parse + validate AI roadmap response ──────────────────────────────
/**
 * tryParseRoadmap(raw, expectedDays)
 *
 * Parses a raw AI string into a validated array of roadmap items.
 * `expectedDays` is the target count; we accept ±0 tolerance in strict mode.
 * On parse failure the caller is expected to retry with a corrective prompt.
 *
 * @param {string} raw
 * @param {number} expectedDays
 * @returns {Array<{day, focusArea, task, completed}>}
 */
const tryParseRoadmap = (raw, expectedDays) => {
  const parsed = JSON.parse(stripFences(raw));
  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array.');
  if (parsed.length !== expectedDays) {
    throw new Error(`Expected ${expectedDays} daily items, got ${parsed.length}.`);
  }
  return parsed.map((item, idx) => {
    if (!item.day || !item.focusArea || !item.task) {
      throw new Error(`Item at index ${idx} is missing required fields.`);
    }
    return {
      day:       String(item.day).trim(),
      focusArea: String(item.focusArea).trim(),
      task:      String(item.task).trim(),
      completed: false,
    };
  });
};

// ── Helper: call Gemini with one automatic retry on parse failure ──────────────
const generateAndParse = async (prompt, expectedDays, label) => {
  let rawResponse;
  try {
    rawResponse = await generateContent(prompt);
  } catch (aiErr) {
    console.error(`[${label}] Gemini failed:`, aiErr.message);
    const err = new Error(aiErr.message || 'AI service is temporarily unavailable.');
    err._status = aiErr._status || 502;
    throw err;
  }

  try {
    return tryParseRoadmap(rawResponse, expectedDays);
  } catch (_firstErr) {
    console.warn(`[${label}] First parse failed — retrying with stricter prompt.`);

    const retryPrompt =
      prompt +
      `\n\nIMPORTANT: Your previous response was invalid. ` +
      `Return ONLY a raw JSON array containing exactly ${expectedDays} objects matching the schema. ` +
      'No markdown, no prose, no extra fields.';

    try {
      const retryRaw = await generateContent(retryPrompt, { skipRetry: true });
      return tryParseRoadmap(retryRaw, expectedDays);
    } catch (retryErr) {
      console.error(`[${label}] Retry also failed to parse:`, retryErr.message);
      const err = new Error('The AI returned an unreadable roadmap format. Please try again.');
      err._status = 502;
      throw err;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/roadmap
// ─────────────────────────────────────────────────────────────────────────────
const getLatestRoadmap = async (req, res) => {
  try {
    const roadmap = await WeeklyRoadmap.findOne({ userId: req.user.id })
      .sort({ weekStartDate: -1 });

    return res.status(200).json({
      success: true,
      roadmap: roadmap || null,
    });
  } catch (err) {
    console.error('[getLatestRoadmap]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/roadmap/saved
// ─────────────────────────────────────────────────────────────────────────────
const getSavedRoadmaps = async (req, res) => {
  try {
    const roadmaps = await WeeklyRoadmap.find({ userId: req.user.id, isSaved: true })
      .sort({ savedAt: -1, weekStartDate: -1 });

    return res.status(200).json({
      success: true,
      roadmaps,
    });
  } catch (err) {
    console.error('[getSavedRoadmaps]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/roadmap/:id/save
// ─────────────────────────────────────────────────────────────────────────────
const toggleSaveRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const roadmap = await WeeklyRoadmap.findOne({ _id: id, userId: req.user.id });

    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found.' });
    }

    roadmap.isSaved = !roadmap.isSaved;
    roadmap.savedAt = roadmap.isSaved ? new Date() : null;
    await roadmap.save();

    return res.status(200).json({
      success: true,
      message: roadmap.isSaved ? 'Roadmap saved.' : 'Roadmap removed from saved list.',
      roadmap,
    });
  } catch (err) {
    console.error('[toggleSaveRoadmap]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/roadmap/generate  (protected)
//
// Body shape per mode:
//   { mode: "profile" }
//   { mode: "company", targetCompany: "Amazon", testDate: "2026-10-01" }
//   { mode: "topic",   customTopic: "System Design" [, days: 10] }
// ─────────────────────────────────────────────────────────────────────────────
const generateRoadmap = async (req, res) => {
  try {
    const mode = (req.body.mode || 'profile').toLowerCase();

    if (!['profile', 'company', 'topic'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid mode "${mode}". Must be one of: profile, company, topic.`,
      });
    }

    // ── 1. Fetch user + DSA progress (needed in all modes) ───────────────────
    const [user, dsaProgress] = await Promise.all([
      User.findById(req.user.id),
      DSAProgress.findOne({ userId: req.user.id }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userContext = buildUserContext(user, dsaProgress);
    const weakDSA     = dsaProgress?.weakTopics    || [];
    const weakResume  = user.resumeAnalysis?.weakPoints || [];

    // ── 2. Mode-specific logic ────────────────────────────────────────────────
    let prompt;
    let planDays;
    let truncated     = false;
    let targetCompany = null;
    let testDate      = null;
    let customTopic   = null;

    // ─── mode: "profile" ────────────────────────────────────────────────────
    if (mode === 'profile') {
      planDays = 7;
      prompt   = buildProfileRoadmapPrompt(userContext, weakDSA, weakResume);
    }

    // ─── mode: "company" ────────────────────────────────────────────────────
    else if (mode === 'company') {
      targetCompany = (req.body.targetCompany || '').trim();
      const rawDate = req.body.testDate;

      if (!targetCompany) {
        return res.status(400).json({
          success: false,
          message: 'targetCompany is required for company mode.',
        });
      }
      if (!rawDate) {
        return res.status(400).json({
          success: false,
          message: 'testDate is required for company mode.',
        });
      }

      testDate = new Date(rawDate);
      if (isNaN(testDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'testDate is not a valid date.',
        });
      }

      const today    = new Date();
      today.setHours(0, 0, 0, 0);
      testDate.setHours(0, 0, 0, 0);

      const msPerDay    = 24 * 60 * 60 * 1000;
      const actualDays  = Math.round((testDate - today) / msPerDay);

      if (actualDays < MIN_PLAN_DAYS) {
        return res.status(400).json({
          success: false,
          message:
            actualDays <= 0
              ? 'testDate must be in the future.'
              : `Only ${actualDays} day(s) until testDate — not enough time for a meaningful plan.`,
        });
      }

      truncated = actualDays > MAX_PLAN_DAYS;
      planDays  = truncated ? MAX_PLAN_DAYS : actualDays;

      prompt = buildCompanyRoadmapPrompt(
        userContext, weakDSA, targetCompany, planDays, truncated,
      );
    }

    // ─── mode: "topic" ──────────────────────────────────────────────────────
    else {
      customTopic = (req.body.customTopic || '').trim();

      if (!customTopic) {
        return res.status(400).json({
          success: false,
          message: 'customTopic is required for topic mode.',
        });
      }

      // Optional student-specified length; default 7, clamp to [1, 30]
      const reqDays = parseInt(req.body.days, 10);
      planDays = Number.isFinite(reqDays)
        ? Math.min(Math.max(reqDays, 1), MAX_PLAN_DAYS)
        : 7;

      prompt = buildTopicRoadmapPrompt(customTopic, planDays);
    }

    // ── 3. Generate + parse ───────────────────────────────────────────────────
    let items;
    try {
      items = await generateAndParse(prompt, planDays, `generateRoadmap:${mode}`);
    } catch (genErr) {
      return res.status(genErr._status || 502).json({
        success: false,
        message: genErr.message,
      });
    }

    // ── 4. Persist ────────────────────────────────────────────────────────────
    const now      = new Date();
    const endDate  = new Date(now.getTime() + planDays * 24 * 60 * 60 * 1000);

    const roadmapDoc = new WeeklyRoadmap({
      userId:        req.user.id,
      mode,
      ...(targetCompany && { targetCompany }),
      ...(testDate      && { testDate }),
      ...(customTopic   && { customTopic }),
      weekStartDate: now,
      weekEndDate:   endDate,
      items,
      generatedAt:   now,
    });

    await roadmapDoc.save();

    // ── 5. Respond ────────────────────────────────────────────────────────────
    const meta = {};
    if (truncated) {
      meta.truncationNote =
        `Your test date is more than ${MAX_PLAN_DAYS} days away. ` +
        `This plan covers the next ${MAX_PLAN_DAYS} days. ` +
        'Regenerate closer to your test date for an updated plan.';
    }

    return res.status(201).json({
      success: true,
      message: `${mode.charAt(0).toUpperCase() + mode.slice(1)} roadmap generated successfully.`,
      roadmap: roadmapDoc,
      ...(Object.keys(meta).length && { meta }),
    });

  } catch (err) {
    console.error('[generateRoadmap]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/roadmap/:id/:day/toggle
// ─────────────────────────────────────────────────────────────────────────────
const toggleDayCompleted = async (req, res) => {
  const { id, day } = req.params;

  try {
    const roadmap = await WeeklyRoadmap.findOne({ _id: id, userId: req.user.id });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'No roadmap found.',
      });
    }

    const item = roadmap.items.find(
      (it) => it.day.toLowerCase() === day.trim().toLowerCase()
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Roadmap item for "${day}" not found.`,
      });
    }

    item.completed = !item.completed;
    await roadmap.save();

    return res.status(200).json({
      success: true,
      message: `Marked ${item.day} as ${item.completed ? 'complete' : 'incomplete'}.`,
      roadmap,
    });
  } catch (err) {
    console.error('[toggleDayCompleted]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = {
  getLatestRoadmap,
  getSavedRoadmaps,
  toggleSaveRoadmap,
  generateRoadmap,
  toggleDayCompleted,
};
