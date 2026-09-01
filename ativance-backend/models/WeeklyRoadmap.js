const mongoose = require('mongoose');

/**
 * WeeklyRoadmap
 *
 * Stores AI-generated study plans for a user.
 * Supports three generation modes:
 *   - "profile" : built from the user's weak areas / profile context (7-day plan)
 *   - "company"  : targets a specific company with a deadline-driven day count
 *   - "topic"    : a focused plan on a single custom topic
 *
 * The `items` array is intentionally unbounded — day count is determined at
 * generation time and varies per mode.
 */

const RoadmapItemSchema = new mongoose.Schema(
  {
    day: {
      type:     String,
      required: [true, 'Day label (e.g. "Day 1") is required'],
      trim:     true,
    },
    focusArea: {
      type:     String,
      required: [true, 'Focus area is required'],
      trim:     true,
    },
    task: {
      type:     String,
      required: [true, 'Task description is required'],
      trim:     true,
    },
    completed: {
      type:    Boolean,
      default: false,
    },
  },
  { _id: false } // no separate _id per daily item
);

const WeeklyRoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required'],
      index:    true,
    },

    // ── Generation mode ──────────────────────────────────────────────────────
    mode: {
      type:    String,
      enum:    ['profile', 'company', 'topic'],
      default: 'profile',
    },

    // ── Mode-specific metadata (all optional) ────────────────────────────────

    /** "company" mode: the target company the student is preparing for */
    targetCompany: {
      type: String,
      trim: true,
    },

    /** "company" mode: interview / test date driving the day-count calculation */
    testDate: {
      type: Date,
    },

    /** "topic" mode: the free-text topic the student wants to drill */
    customTopic: {
      type: String,
      trim: true,
    },

    // ── Plan window (informational, may span > 7 days) ───────────────────────
    weekStartDate: {
      type:    Date,
      default: Date.now,
    },
    weekEndDate: {
      type: Date,
    },

    // ── Daily items (dynamic length — no fixed-7 constraint) ─────────────────
    items: {
      type:     [RoadmapItemSchema],
      required: [true, 'Roadmap items are required'],
      validate: [
        (val) => val.length >= 1,
        'Roadmap must contain at least 1 item.',
      ],
    },

    generatedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // manages createdAt and updatedAt automatically
  }
);

// Compound index to quickly find the latest roadmap for a user
WeeklyRoadmapSchema.index({ userId: 1, weekStartDate: -1 });

module.exports = mongoose.model('WeeklyRoadmap', WeeklyRoadmapSchema);
