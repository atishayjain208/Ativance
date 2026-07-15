const User             = require('../models/User');
const DSAProgress      = require('../models/DSAProgress');
const MentorChat       = require('../models/MentorChat');
const { buildUserContext } = require('../utils/userContext');
const { generateContent }  = require('../utils/geminiClient');

// ── Helper: Format message history for plain text prompt ──────────────────────
const formatHistoryForPrompt = (messages) => {
  return messages
    .map((msg) => {
      const label = msg.role === 'user' ? 'Student' : 'Mentor';
      return `${label}: ${msg.message}`;
    })
    .join('\n');
};

// ── POST /api/mentor/chat ─────────────────────────────────────────────────────
const chatWithMentor = async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required.' });
  }

  try {
    // ── 1. Fetch User profile + DSA progress for context ──────────────────────
    const [user, dsaProgress] = await Promise.all([
      User.findById(req.user.id),
      DSAProgress.findOne({ userId: req.user.id }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userContext = buildUserContext(user, dsaProgress);

    // ── 2. Fetch or initialize MentorChat session ──────────────────────────────
    let chat = await MentorChat.findOne({ userId: req.user.id });
    if (!chat) {
      chat = new MentorChat({ userId: req.user.id, messages: [] });
    }

    // ── 3. Handle history trimming ──────────────────────────────────────────
    // Get last 10 messages of chat history to send to Gemini
    const lastTenHistory = chat.messages.slice(-10);
    const historyText    = formatHistoryForPrompt(lastTenHistory);

    // ── 4. Build prompt for Gemini ────────────────────────────────────────────
    const prompt = `You are "Ativance Mentor", an expert software engineering career advisor, technical interview coach, and mentor. 
Your goal is to guide the student with personalized, friendly, and actionable career advice, technical learning strategies, resume improvements, and DSA prep strategies.

Here is the student's current profile context:
---
${userContext}
---

${historyText ? `Conversation history:\n${historyText}\n` : ''}
Current message:
Student: ${question.trim()}

Mentor:`;

    // ── 5. Call Gemini ────────────────────────────────────────────────────────
    let reply;
    try {
      reply = await generateContent(prompt);
    } catch (aiErr) {
      console.error('[MentorChat] Gemini call failed:', aiErr.message);
      return res.status(aiErr._status || 502).json({
        success: false,
        message: aiErr.message || 'AI Mentor is temporarily offline. Please try again shortly.',
      });
    }

    // ── 6. Persist conversation ───────────────────────────────────────────────
    // Save user's question
    chat.messages.push({
      role:      'user',
      message:   question.trim(),
      timestamp: new Date(),
    });

    // Save AI's response
    chat.messages.push({
      role:      'assistant',
      message:   reply.trim(),
      timestamp: new Date(),
    });

    // If history grows beyond 15 messages, trim the oldest ones in the document
    // to control token usage and prevent DB document bloat.
    if (chat.messages.length > 15) {
      chat.messages = chat.messages.slice(-15);
    }

    await chat.save();

    // ── 7. Respond ────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      reply:   reply.trim(),
      chat:    chat.messages, // return trimmed history to frontend
    });
  } catch (err) {
    console.error('[chatWithMentor]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── GET /api/mentor/history ───────────────────────────────────────────────────
const getMentorHistory = async (req, res) => {
  try {
    const chat = await MentorChat.findOne({ userId: req.user.id });
    return res.status(200).json({
      success: true,
      chat:    chat ? chat.messages : [],
    });
  } catch (err) {
    console.error('[getMentorHistory]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = { chatWithMentor, getMentorHistory };
