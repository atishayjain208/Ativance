const mongoose = require('mongoose');

/**
 * InterviewSession
 *
 * Tracks an active or completed mock interview simulation session.
 * Stores target company, interview type, and conversation history.
 */

const ChatMessageSchema = new mongoose.Schema(
  {
    role: {
      type:     String,
      enum:     ['interviewer', 'candidate'],
      required: [true, 'Message role is required'],
    },
    message: {
      type:     String,
      required: [true, 'Message content is required'],
      trim:     true,
    },
    timestamp: {
      type:    Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required'],
      index:    true,
    },
    targetCompany: {
      type:     String,
      required: [true, 'Target company is required'],
      trim:     true,
    },
    interviewType: {
      type:     String,
      enum:     ['Technical', 'HR', 'Behavioral'],
      required: [true, 'Interview type is required'],
    },
    messages: {
      type:    [ChatMessageSchema],
      default: [],
    },
    status: {
      type:    String,
      enum:    ['active', 'completed'],
      default: 'active',
    },
    evaluation: {
      technicalDepth: { type: Number, min: 1, max: 10 },
      communication:  { type: Number, min: 1, max: 10 },
      confidence:     { type: Number, min: 1, max: 10 },
      tips: [
        {
          question: { type: String, required: true },
          tip:      { type: String, required: true },
        }
      ],
      evaluatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
