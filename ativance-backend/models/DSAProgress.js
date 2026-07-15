const mongoose = require('mongoose');

/**
 * DSAProgress
 *
 * Tracks a student's DSA (Data Structures & Algorithms) solving progress,
 * linked one-to-one with a User for the MVP (one active document per user).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔮 FUTURE IMPROVEMENT — Automated LeetCode sync:
 *   In the MVP, all counts are entered manually by the user via a form.
 *   There is no official public LeetCode API, but community-maintained
 *   solutions exist (e.g. the unofficial LeetCode GraphQL endpoint at
 *   https://leetcode.com/graphql). A future iteration could poll this
 *   endpoint (with user consent and their LeetCode username) to auto-sync
 *   solved counts instead of relying on self-reported data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TopicEntrySchema = new mongoose.Schema(
  {
    topic: {
      type:     String,
      required: [true, 'Topic name is required'],
      trim:     true,
    },
    count: {
      type:    Number,
      default: 0,
      min:     [0, 'Count cannot be negative'],
    },
  },
  { _id: false }
);

// Sub-schema for a single AI-recommended practice problem
const RecommendedProblemSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    topic:      { type: String, required: true, trim: true },
  },
  { _id: false }
);

const DSAProgressSchema = new mongoose.Schema(
  {
    // ── Relation ───────────────────────────────────────────────────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required'],
      index:    true,
    },

    // ── Difficulty breakdown ───────────────────────────────────────────────────
    // Self-reported counts (MVP). Fields can be extended with custom tiers
    // (e.g. "premium", "blind75") without schema migration thanks to strict: false.
    solvedByDifficulty: {
      easy:   { type: Number, default: 0, min: 0 },
      medium: { type: Number, default: 0, min: 0 },
      hard:   { type: Number, default: 0, min: 0 },
    },

    // ── Topic-wise breakdown ───────────────────────────────────────────────────
    // Stored as an array of { topic, count } objects so Mongoose can validate
    // each entry. The SCHEMA.md documents this as a flexible key-value map;
    // the array representation achieves the same flexibility while remaining
    // query-friendly (e.g. $elemMatch on topic names).
    solvedByTopic: {
      type:    [TopicEntrySchema],
      default: [],
    },

    // ── AI / rule-based weak topics ────────────────────────────────────────────
    // Populated by POST /api/dsa/analyze — rule-based detection against baselines.
    weakTopics: {
      type:    [String],
      default: [],
    },

    // ── AI-recommended practice problems ──────────────────────────────────────
    // One entry per weak topic, each containing 8–12 specific problem suggestions
    // returned by Gemini. Replaced on every /analyze call.
    recommendedProblems: {
      type:    [RecommendedProblemSchema],
      default: [],
    },

    // When the last AI analysis was successfully run
    analysisGeneratedAt: {
      type:    Date,
      default: null,
    },

    // ── Timestamps ─────────────────────────────────────────────────────────────
    lastUpdated: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    // strict: true (default) — intentional here so we don't silently accept
    // arbitrary fields outside the schema. Unlike User/githubStats which hold
    // AI payloads of unknown shape, DSAProgress has a well-defined structure.
  }
);

// ── Virtual: total problems solved across all difficulties ─────────────────────
DSAProgressSchema.virtual('totalSolved').get(function () {
  const d = this.solvedByDifficulty;
  return (d.easy || 0) + (d.medium || 0) + (d.hard || 0);
});

// ── Instance method: upsert a topic count ─────────────────────────────────────
// Usage: await progress.setTopicCount('Arrays', 15); await progress.save();
DSAProgressSchema.methods.setTopicCount = function (topic, count) {
  const entry = this.solvedByTopic.find(
    (t) => t.topic.toLowerCase() === topic.toLowerCase()
  );
  if (entry) {
    entry.count = count;
  } else {
    this.solvedByTopic.push({ topic, count });
  }
};

module.exports = mongoose.model('DSAProgress', DSAProgressSchema);
