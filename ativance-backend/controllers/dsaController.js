const DSAProgress = require('../models/DSAProgress');
const { detectWeakTopics }      = require('../utils/dsaAnalyzer');
const { buildDSAProblemPrompt } = require('../utils/dsaPrompt');
const { generateContent }       = require('../utils/geminiClient');

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

// ── POST /api/dsa/analyze ─────────────────────────────────────────────────────
const analyzeWeakTopics = async (req, res) => {
  // ── 1. Load the user's progress ─────────────────────────────────────────────
  let progress;
  try {
    progress = await DSAProgress.findOne({ userId: req.user.id });
  } catch (err) {
    console.error('[analyzeWeakTopics] DB fetch:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }

  if (!progress) {
    return res.status(400).json({
      success: false,
      message: 'No DSA progress found. Please submit your solved counts first via POST /api/dsa/update.',
    });
  }

  // ── 2. Rule-based weak-topic detection ──────────────────────────────────────
  const weakEntries = detectWeakTopics(progress.solvedByTopic);

  if (!weakEntries.length) {
    return res.status(200).json({
      success:    true,
      message:    'No weak topics detected — you are at or above the baseline on all major topics!',
      weakTopics: [],
      recommendedProblems: [],
    });
  }

  const weakTopicNames = weakEntries.map((e) => e.topic);
  console.log(`[analyzeWeakTopics] Weak topics for user ${req.user.id}:`, weakTopicNames);

  // ── 3. Fetch Gemini recommendations per weak topic ───────────────────────────
  // Run max 3 Gemini calls concurrently to avoid hammering the API.
  const stripFences = (raw) =>
    raw.trim()
       .replace(/^```(?:json)?\s*/i, '')
       .replace(/\s*```\s*$/, '')
       .trim();

  const tryParseProblems = (raw) => {
    const parsed = JSON.parse(stripFences(raw));
    if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array.');
    // Validate each item has the required fields
    return parsed.filter(
      (p) =>
        p &&
        typeof p.title      === 'string' && p.title.trim() &&
        typeof p.difficulty === 'string' && ['Easy', 'Medium', 'Hard'].includes(p.difficulty) &&
        typeof p.topic      === 'string' && p.topic.trim()
    );
  };

  const fetchProblemsForTopic = async ({ topic, count, threshold }) => {
    const prompt = buildDSAProblemPrompt(topic, count, threshold);
    let rawAI;

    try {
      rawAI = await generateContent(prompt);
    } catch (aiErr) {
      console.error(`[analyzeWeakTopics] Gemini failed for "${topic}" (tag=${aiErr._tag}):`, aiErr.message);
      return []; // non-fatal: skip this topic
    }

    try {
      return tryParseProblems(rawAI);
    } catch (_firstErr) {
      console.warn(`[analyzeWeakTopics] First parse failed for "${topic}" — retrying.`);
      const retryPrompt =
        prompt +
        '\n\nIMPORTANT: Your previous response could not be parsed as a JSON array. ' +
        'Return ONLY a raw JSON array of { title, difficulty, topic } objects. No other text.';
      try {
        const retryRaw = await generateContent(retryPrompt, { skipRetry: true });
        return tryParseProblems(retryRaw);
      } catch (retryErr) {
        console.error(`[analyzeWeakTopics] Retry also failed for "${topic}":`, retryErr.message);
        return [];
      }
    }
  };

  // Concurrency-limited runner (max 3 in-flight at once)
  const runWithConcurrency = async (tasks, limit) => {
    const results = [];
    let idx = 0;
    const worker = async () => {
      while (idx < tasks.length) {
        const i = idx++;
        results[i] = await tasks[i]();
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
    return results;
  };

  const problemArrays = await runWithConcurrency(
    weakEntries.map((entry) => () => fetchProblemsForTopic(entry)),
    3
  );

  // Flatten all per-topic problem arrays into one list
  const recommendedProblems = problemArrays.flat();
  const analysisGeneratedAt = new Date();

  // ── 4. Persist weak topics + recommendations ─────────────────────────────────
  try {
    await DSAProgress.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          weakTopics:          weakTopicNames,
          recommendedProblems,
          analysisGeneratedAt,
          lastUpdated:         analysisGeneratedAt,
        },
      },
      { new: true }
    );
  } catch (dbErr) {
    console.error('[analyzeWeakTopics] DB save failed:', dbErr.message);
    // Non-fatal — return the analysis even if persistence fails
  }

  // ── 5. Respond ───────────────────────────────────────────────────────────────
  return res.status(200).json({
    success:             true,
    message:             `Found ${weakTopicNames.length} weak topic(s). ${recommendedProblems.length} problems recommended.`,
    weakTopics:          weakTopicNames,
    weakTopicDetails:    weakEntries,          // includes count, threshold, gap
    recommendedProblems,
    analysisGeneratedAt,
  });
};

module.exports = { getDSAProgress, updateDSAProgress, analyzeWeakTopics };

