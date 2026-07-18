const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: sign a JWT for a given userId ─────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Helper: strip sensitive fields and return a clean user object ─────────────
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  skills: user.skills,
  education: user.education,
  goals: user.goals,
  targetCompanies: user.targetCompanies,
  availableStudyHours: user.availableStudyHours,
  resumeAnalysis: user.resumeAnalysis,
  githubStats: user.githubStats,
  createdAt: user.createdAt,
});

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email, and password are all required.',
      });
    }

    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }

    // 3. Create user — password hashed automatically by pre-save hook
    const user = await User.create({ name, email, password });

    // 4. Issue JWT
    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    // Mongoose validation errors (e.g. password too short, invalid formats)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // Mongoose duplicate key race condition fallback
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }
    console.error('[signup]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required.',
      });
    }

    // 2. Find user — explicitly include password (select: false on schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Issue JWT
    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = { signup, login };
