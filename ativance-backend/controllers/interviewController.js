const User             = require('../models/User');
const DSAProgress      = require('../models/DSAProgress');
const InterviewSession = require('../models/InterviewSession');
const { buildUserContext } = require('../utils/userContext');
const { generateContent }  = require('../utils/geminiClient');
const {
  buildInterviewStartPrompt,
  buildInterviewNextPrompt,
} = require('../utils/interviewPrompt');
const { buildEvaluationPrompt } = require('../utils/evaluationPrompt');

// ── Helper: strip markdown code fences ────────────────────────────────────────
const stripFences = (raw) =>
  raw.trim()
     .replace(/^```(?:json)?\s*/i, '')
     .replace(/\s*```\s*$/, '')
     .trim();

// ── Helper: format session messages into readable interviewer history ──────────
const formatHistoryForPrompt = (messages) => {
  return messages
    .map((msg) => {
      const label = msg.role === 'interviewer' ? 'Interviewer' : 'Candidate';
      return `${label}: ${msg.message}`;
    })
    .join('\n');
};

// ── POST /api/interview/start ─────────────────────────────────────────────────
const startInterview = async (req, res) => {
  const { targetCompany, interviewType } = req.body;

  if (!targetCompany || !targetCompany.trim()) {
    return res.status(400).json({ success: false, message: 'Target company is required.' });
  }
  if (!['Technical', 'HR', 'Behavioral'].includes(interviewType)) {
    return res.status(400).json({ success: false, message: 'Invalid interview type.' });
  }

  try {
    // ── 1. Fetch user context ────────────────────────────────────────────────
    const [user, dsaProgress] = await Promise.all([
      User.findById(req.user.id),
      DSAProgress.findOne({ userId: req.user.id }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userContext = buildUserContext(user, dsaProgress);

    // ── 2. Run Gemini to generate opening question ───────────────────────────
    const prompt = buildInterviewStartPrompt(userContext, targetCompany.trim(), interviewType);

    const tryParseQuestion = (raw) => {
      const parsed = JSON.parse(stripFences(raw));
      if (!parsed.question || typeof parsed.question !== 'string' || !parsed.question.trim()) {
        throw new Error('JSON response is missing a valid "question" field.');
      }
      return parsed.question.trim();
    };

    let rawResponse;
    try {
      rawResponse = await generateContent(prompt);
    } catch (aiErr) {
      console.error('[startInterview] Gemini call failed:', aiErr.message);
      return res.status(aiErr._status || 502).json({
        success: false,
        message: aiErr.message || 'AI service is temporarily offline.',
      });
    }

    let question;
    try {
      question = tryParseQuestion(rawResponse);
    } catch (_firstErr) {
      console.warn('[startInterview] First parse failed — retrying.');

      const retryPrompt =
        prompt +
        '\n\nIMPORTANT: Your previous response was not valid JSON. ' +
        'Return ONLY a valid JSON object: { "question": "Your question here" }';

      try {
        const retryRaw = await generateContent(retryPrompt, { skipRetry: true });
        question = tryParseQuestion(retryRaw);
      } catch (retryErr) {
        console.error('[startInterview] Retry also failed:', retryErr.message);
        return res.status(502).json({
          success: false,
          message: 'Failed to generate interview question. Please try again.',
        });
      }
    }

    // ── 3. Save session in DB ────────────────────────────────────────────────
    const session = new InterviewSession({
      userId:        req.user.id,
      targetCompany: targetCompany.trim(),
      interviewType,
      messages: [
        {
          role:      'interviewer',
          message:   question,
          timestamp: new Date(),
        },
      ],
      status: 'active',
    });

    await session.save();

    return res.status(201).json({
      success:   true,
      sessionId: session._id,
      question,
      status:    session.status,
    });
  } catch (err) {
    console.error('[startInterview]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── POST /api/interview/next ──────────────────────────────────────────────────
const nextInterviewQuestion = async (req, res) => {
  const { sessionId, answer } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required.' });
  }
  if (!answer || !answer.trim()) {
    return res.status(400).json({ success: false, message: 'Answer is required.' });
  }

  try {
    // ── 1. Retrieve active interview session ─────────────────────────────────
    const session = await InterviewSession.findOne({
      _id:    sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This interview session has already concluded.',
      });
    }

    // Save candidate's answer
    session.messages.push({
      role:      'candidate',
      message:   answer.trim(),
      timestamp: new Date(),
    });

    // ── 2. Load context ──────────────────────────────────────────────────────
    const [user, dsaProgress] = await Promise.all([
      User.findById(req.user.id),
      DSAProgress.findOne({ userId: req.user.id }),
    ]);

    const userContext = buildUserContext(user, dsaProgress);

    // Get count of interviewer questions asked so far
    const interviewerQuestions = session.messages.filter((m) => m.role === 'interviewer');
    const questionCount        = interviewerQuestions.length;

    // ── 3. Build prompt and ask Gemini ───────────────────────────────────────
    const historyText = formatHistoryForPrompt(session.messages.slice(0, -1)); // exclude latest answer from history format
    const prompt = buildInterviewNextPrompt(
      userContext,
      session.targetCompany,
      session.interviewType,
      historyText,
      answer.trim(),
      questionCount
    );

    const tryParseQuestion = (raw) => {
      const parsed = JSON.parse(stripFences(raw));
      if (!parsed.question || typeof parsed.question !== 'string' || !parsed.question.trim()) {
        throw new Error('JSON response is missing a valid "question" field.');
      }
      return parsed.question.trim();
    };

    let rawResponse;
    try {
      rawResponse = await generateContent(prompt);
    } catch (aiErr) {
      console.error('[nextInterviewQuestion] Gemini failed:', aiErr.message);
      return res.status(aiErr._status || 502).json({
        success: false,
        message: aiErr.message || 'AI service is temporarily offline.',
      });
    }

    let nextQuestion;
    try {
      nextQuestion = tryParseQuestion(rawResponse);
    } catch (_firstErr) {
      console.warn('[nextInterviewQuestion] First parse failed — retrying.');

      const retryPrompt =
        prompt +
        '\n\nIMPORTANT: Your previous response was not valid JSON. ' +
        'Return ONLY a valid JSON object: { "question": "Your question here" }';

      try {
        const retryRaw = await generateContent(retryPrompt, { skipRetry: true });
        nextQuestion = tryParseQuestion(retryRaw);
      } catch (retryErr) {
        console.error('[nextInterviewQuestion] Retry failed:', retryErr.message);
        return res.status(502).json({
          success: false,
          message: 'Failed to generate the next question. Please try again.',
        });
      }
    }

    // Save interviewer's next question
    session.messages.push({
      role:      'interviewer',
      message:   nextQuestion,
      timestamp: new Date(),
    });

    // Mark session completed if we just asked the wrap-up question
    if (questionCount >= 4) {
      session.status = 'completed';
    }

    await session.save();

    return res.status(200).json({
      success:  true,
      question: nextQuestion,
      status:   session.status,
      chat:     session.messages, // return full thread to frontend
    });
  } catch (err) {
    console.error('[nextInterviewQuestion]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── POST /api/interview/evaluate ──────────────────────────────────────────────
const evaluateInterview = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required.' });
  }

  try {
    // ── 1. Fetch completed interview session ─────────────────────────────────
    const session = await InterviewSession.findOne({
      _id:    sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    // Skip evaluation if it has already been generated
    if (session.evaluation && session.evaluation.evaluatedAt) {
      return res.status(200).json({
        success:    true,
        message:    'Evaluation retrieved successfully.',
        evaluation: session.evaluation,
      });
    }

    // Must have dialogue history to evaluate
    if (session.messages.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient interview dialogue history to run evaluation.',
      });
    }

    // ── 2. Format history log ────────────────────────────────────────────────
    const historyText = formatHistoryForPrompt(session.messages);

    // ── 3. Call Gemini to evaluate performance ────────────────────────────────
    const prompt = buildEvaluationPrompt(
      session.targetCompany,
      session.interviewType,
      historyText
    );

    const tryParseEvaluation = (raw) => {
      const parsed = JSON.parse(stripFences(raw));
      
      // Validate structure
      const hasScores =
        typeof parsed.technicalDepth === 'number' &&
        typeof parsed.communication  === 'number' &&
        typeof parsed.confidence     === 'number';

      if (!hasScores || !Array.isArray(parsed.tips)) {
        throw new Error('Evaluation JSON is missing scores or tips array.');
      }

      const validatedTips = parsed.tips.map((t, idx) => {
        if (!t.question || !t.tip) {
          throw new Error(`Tip at index ${idx} is missing question or recommendation text.`);
        }
        return {
          question: String(t.question).trim(),
          tip:      String(t.tip).trim(),
        };
      });

      return {
        technicalDepth: Math.max(1, Math.min(10, Math.round(parsed.technicalDepth))),
        communication:  Math.max(1, Math.min(10, Math.round(parsed.communication))),
        confidence:     Math.max(1, Math.min(10, Math.round(parsed.confidence))),
        tips:           validatedTips,
        evaluatedAt:    new Date(),
      };
    };

    let rawAI;
    try {
      rawAI = await generateContent(prompt);
    } catch (aiErr) {
      console.error('[evaluateInterview] Gemini call failed:', aiErr.message);
      return res.status(aiErr._status || 502).json({
        success: false,
        message: aiErr.message || 'AI service is temporarily offline.',
      });
    }

    let evaluation;
    try {
      evaluation = tryParseEvaluation(rawAI);
    } catch (_firstErr) {
      console.warn('[evaluateInterview] First parse failed — retrying.');

      const retryPrompt =
        prompt +
        '\n\nIMPORTANT: Your previous response was invalid. ' +
        'Return ONLY a valid JSON object matching the requested schema. No code fences, no prose.';

      try {
        const retryRaw = await generateContent(retryPrompt, { skipRetry: true });
        evaluation = tryParseEvaluation(retryRaw);
      } catch (retryErr) {
        console.error('[evaluateInterview] Retry also failed to parse:', retryErr.message);
        return res.status(502).json({
          success: false,
          message: 'Failed to generate mock interview evaluation. Please try again.',
        });
      }
    }

    // ── 4. Persist evaluation to DB ──────────────────────────────────────────
    session.evaluation = evaluation;
    if (session.status !== 'completed') {
      session.status = 'completed'; // auto-complete if evaluated early
    }
    await session.save();

    return res.status(200).json({
      success:    true,
      message:    'Interview performance evaluated successfully.',
      evaluation,
    });
  } catch (err) {
    console.error('[evaluateInterview]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = { startInterview, nextInterviewQuestion, evaluateInterview };
