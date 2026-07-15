const User          = require('../models/User');
const DSAProgress   = require('../models/DSAProgress');
const WeeklyRoadmap = require('../models/WeeklyRoadmap');
const { buildUserContext }          = require('../utils/userContext');
const { generateContent }           = require('../utils/geminiClient');
const { buildWeeklyRoadmapPrompt }  = require('../utils/roadmapPrompt');

// ── Helper: strip markdown fences (mirrors resume/github controllers) ─────────
const stripFences = (raw) =>
  raw.trim()
     .replace(/^```(?:json)?\s*/i, '')
     .replace(/\s*```\s*$/, '')
     .trim();

// ── GET /api/roadmap ──────────────────────────────────────────────────────────
const getLatestRoadmap = async (req, res) => {
  try {
    // Find the latest roadmap by weekStartDate descending
    const roadmap = await WeeklyRoadmap.findOne({ userId: req.user.id })
      .sort({ weekStartDate: -1 });

    return res.status(200).json({
      success: true,
      roadmap: roadmap || null, // null if no roadmap generated yet
    });
  } catch (err) {
    console.error('[getLatestRoadmap]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── POST /api/roadmap/generate ────────────────────────────────────────────────
const generateRoadmap = async (req, res) => {
  try {
    // ── 1. Fetch profile + DSA progress ───────────────────────────────────────
    const [user, dsaProgress] = await Promise.all([
      User.findById(req.user.id),
      DSAProgress.findOne({ userId: req.user.id }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userContext = buildUserContext(user, dsaProgress);
    const weakDSA     = dsaProgress ? dsaProgress.weakTopics : [];
    const weakResume  = user.resumeAnalysis ? user.resumeAnalysis.weakPoints : [];

    // ── 2. Build prompt and invoke Gemini ─────────────────────────────────────
    const prompt = buildWeeklyRoadmapPrompt(userContext, weakDSA, weakResume);

    const tryParseRoadmap = (raw) => {
      const parsed = JSON.parse(stripFences(raw));
      if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array.');
      if (parsed.length !== 7) {
        throw new Error(`Expected exactly 7 daily items, got ${parsed.length}.`);
      }
      // Validate schema of each day
      return parsed.map((item, idx) => {
        if (!item.day || !item.focusArea || !item.task) {
          throw new Error(`Item at index ${idx} is missing required fields.`);
        }
        return {
          day:       String(item.day).trim(),
          focusArea: String(item.focusArea).trim(),
          task:      String(item.task).trim(),
          completed: false, // every day starts incomplete
        };
      });
    };

    let rawResponse;
    try {
      rawResponse = await generateContent(prompt);
    } catch (aiErr) {
      console.error('[generateRoadmap] Gemini failed:', aiErr.message);
      return res.status(aiErr._status || 502).json({
        success: false,
        message: aiErr.message || 'AI service is temporarily unavailable.',
      });
    }

    let items;
    try {
      items = tryParseRoadmap(rawResponse);
    } catch (_firstErr) {
      console.warn('[generateRoadmap] First parse failed — retrying with stricter prompt.');

      const retryPrompt =
        prompt +
        '\n\nIMPORTANT: Your previous response was invalid. ' +
        'Return ONLY a raw JSON array containing exactly 7 objects matching the schema.';

      try {
        const retryRaw = await generateContent(retryPrompt, { skipRetry: true });
        items = tryParseRoadmap(retryRaw);
      } catch (retryErr) {
        console.error('[generateRoadmap] Retry also failed to parse:', retryErr.message);
        return res.status(502).json({
          success: false,
          message: 'The AI returned an unreadable roadmap format. Please try again.',
        });
      }
    }

    // ── 3. Save as new WeeklyRoadmap document ─────────────────────────────────
    const roadmap = new WeeklyRoadmap({
      userId:        req.user.id,
      weekStartDate: new Date(),
      weekEndDate:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items,
      generatedAt:   new Date(),
    });

    await roadmap.save();

    return res.status(201).json({
      success: true,
      message: 'Weekly roadmap generated successfully.',
      roadmap,
    });
  } catch (err) {
    console.error('[generateRoadmap]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── PATCH /api/roadmap/:day/toggle ────────────────────────────────────────────
const toggleDayCompleted = async (req, res) => {
  const { day } = req.params; // e.g. "Day 1", "Day 2"

  try {
    // Find the latest roadmap for this user
    const roadmap = await WeeklyRoadmap.findOne({ userId: req.user.id })
      .sort({ weekStartDate: -1 });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'No roadmap found. Please generate a roadmap first.',
      });
    }

    // Find the specific day's item
    const item = roadmap.items.find(
      (it) => it.day.toLowerCase() === day.trim().toLowerCase()
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Roadmap item for "${day}" not found.`,
      });
    }

    // Toggle the completed state
    item.completed = !item.completed;

    // Save modifications
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
  generateRoadmap,
  toggleDayCompleted,
};
