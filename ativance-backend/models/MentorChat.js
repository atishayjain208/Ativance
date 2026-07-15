const mongoose = require('mongoose');

/**
 * MentorChat
 *
 * Stores conversation history between the student and the AI Career Mentor.
 * Linked to a User. Contains an array of messages representing the chat thread.
 */

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type:     String,
      enum:     ['user', 'assistant'],
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
  { _id: false } // no separate _id per message object
);

const MentorChatSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required'],
      unique:   true, // one chat session/thread per user in the MVP
      index:    true,
    },
    messages: {
      type:    [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true, // manages createdAt and updatedAt automatically
  }
);

// Prevent message array from bloating the DB indefinitely (MVP constraint)
// If messages exceed 100, trim the oldest ones.
MentorChatSchema.methods.addMessage = function (role, message) {
  this.messages.push({ role, message, timestamp: new Date() });
  if (this.messages.length > 100) {
    this.messages = this.messages.slice(-100);
  }
};

module.exports = mongoose.model('MentorChat', MentorChatSchema);
