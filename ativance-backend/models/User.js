const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned in queries by default
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: String,
      default: '',
    },
    goals: {
      type: String,
      default: '',
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    availableStudyHours: {
      type: Number,
      default: 0,
    },
    resumeAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resume: {
      filePath:   { type: String, default: '' },
      filename:   { type: String, default: '' },
      uploadedAt: { type: Date },
    },
    githubStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Allows adding extra fields to embedded objects without schema changes
    strict: false,
  }
);

// ── Pre-save hook: hash password only when it has been modified ───────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare a plain-text candidate against the stored hash ──
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
