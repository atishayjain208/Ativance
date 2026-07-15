const mongoose = require('mongoose');

/**
 * WeeklyRoadmap
 *
 * Stores AI-generated weekly study plans for a user.
 * Each document contains a 7-day breakdown of tasks, focus areas, and completion states.
 */

const RoadmapItemSchema = new mongoose.Schema(
  {
    day: {
      type:     String,
      required: [true, 'Day label (e.g. "Monday") is required'],
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
    weekStartDate: {
      type:    Date,
      default: Date.now,
    },
    weekEndDate: {
      type:    Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    items: {
      type:     [RoadmapItemSchema],
      required: [true, 'Roadmap items are required'],
      validate: [
        (val) => val.length === 7,
        'Roadmap must contain exactly 7 items (one for each day)',
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
