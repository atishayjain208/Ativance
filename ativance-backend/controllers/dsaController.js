const DSAProgress = require('../models/DSAProgress');

// ── GET /api/dsa ──────────────────────────────────────────────────────────────
const getDSAProgress = async (req, res) => {
  try {
    const progress = await DSAProgress.findOne({ userId: req.user.id });

    if (!progress) {
      // Return a zeroed-out default rather than 404 — cleaner UX on first load
      return res.status(200).json({
        success:  true,
        progress: null,
        message:  'No DSA progress found. Submit your stats to get started.',
      });
    }

    return res.status(200).json({
      success:    true,
      progress,
      totalSolved: progress.totalSolved, // virtual — won't serialize automatically
    });
  } catch (err) {
    console.error('[getDSAProgress]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── POST /api/dsa/update ──────────────────────────────────────────────────────
const updateDSAProgress = async (req, res) => {
  const { solvedByDifficulty, solvedByTopic } = req.body;

  // ── Validate difficulty counts ─────────────────────────────────────────────
  if (solvedByDifficulty !== undefined) {
    const { easy = 0, medium = 0, hard = 0 } = solvedByDifficulty;
    for (const [key, val] of Object.entries({ easy, medium, hard })) {
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
        return res.status(400).json({
          success: false,
          message: `solvedByDifficulty.${key} must be a non-negative integer.`,
        });
      }
    }
  }

  // ── Validate solvedByTopic ─────────────────────────────────────────────────
  if (solvedByTopic !== undefined) {
    if (!Array.isArray(solvedByTopic)) {
      return res.status(400).json({
        success: false,
        message: 'solvedByTopic must be an array of { topic, count } objects.',
      });
    }

    for (const [i, entry] of solvedByTopic.entries()) {
      if (!entry.topic || typeof entry.topic !== 'string' || !entry.topic.trim()) {
        return res.status(400).json({
          success: false,
          message: `solvedByTopic[${i}].topic must be a non-empty string.`,
        });
      }
      if (typeof entry.count !== 'number' || !Number.isInteger(entry.count) || entry.count < 0) {
        return res.status(400).json({
          success: false,
          message: `solvedByTopic[${i}].count must be a non-negative integer.`,
        });
      }
    }
  }

  // ── Build the update payload ────────────────────────────────────────────────
  const update = { lastUpdated: new Date() };

  if (solvedByDifficulty !== undefined) {
    const { easy = 0, medium = 0, hard = 0 } = solvedByDifficulty;
    update.solvedByDifficulty = { easy, medium, hard };
  }

  if (solvedByTopic !== undefined) {
    // Deduplicate by topic name (last entry wins if duplicates are submitted)
    const seen = new Map();
    for (const entry of solvedByTopic) {
      seen.set(entry.topic.trim(), { topic: entry.topic.trim(), count: entry.count });
    }
    update.solvedByTopic = Array.from(seen.values());
  }

  // ── Upsert the progress document ───────────────────────────────────────────
  let progress;
  try {
    progress = await DSAProgress.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      {
        new:      true,   // return the updated document
        upsert:   true,   // create if it doesn't exist yet
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
  } catch (err) {
    console.error('[updateDSAProgress]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }

  return res.status(200).json({
    success:     true,
    message:     'DSA progress updated successfully.',
    progress,
    totalSolved: progress.totalSolved,
  });
};

module.exports = { getDSAProgress, updateDSAProgress };
