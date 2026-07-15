const path   = require('path');
const User   = require('../models/User');
const { extractTextFromPDF }       = require('../utils/pdfParser');
const { generateContent }          = require('../utils/geminiClient');
const { buildResumeAnalysisPrompt } = require('../utils/resumePrompt');

// ── Helper: strip markdown code fences Gemini sometimes wraps JSON in ────────
const stripFences = (raw) =>
  raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')  // opening fence
    .replace(/\s*```\s*$/,       '')   // closing fence
    .trim();

// ── POST /api/resume/upload ───────────────────────────────────────────────────
const uploadResume = async (req, res) => {
  const filePath   = path.join('uploads', req.file.filename); // relative, portable
  const uploadedAt = new Date();

  // ── Step 1: persist the file reference immediately ────────────────────────
  // We save the path first so the record exists even if text extraction fails.
  let user;
  try {
    user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'resume.filePath':   filePath,
          'resume.filename':   req.file.filename,
          'resume.uploadedAt': uploadedAt,
          'resume.textStatus': 'pending', // will be updated below
        },
      },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (dbErr) {
    console.error('[uploadResume] DB save failed:', dbErr.message);
    return res.status(500).json({ success: false, message: 'Server error saving resume reference.' });
  }

  // ── Step 2: extract text from the PDF ─────────────────────────────────────
  let resumeText     = '';
  let textStatus     = 'extracted';
  let warningMessage = null;

  try {
    const absolutePath = path.join(__dirname, '..', filePath);
    resumeText = await extractTextFromPDF(absolutePath);
  } catch (parseErr) {
    console.warn('[uploadResume] PDF text extraction failed:', parseErr.message);
    textStatus     = 'failed';
    warningMessage = "We couldn't read this PDF — the file may be corrupted, scanned, or image-only. Please try uploading another file.";
  }

  // ── Step 3: persist extracted text (or failure status) ────────────────────
  try {
    user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          resumeText:          resumeText,
          'resume.textStatus': textStatus,
        },
      },
      { new: true, select: '-password' }
    );
  } catch (dbErr) {
    // Non-fatal — file is saved, only text storage failed
    console.error('[uploadResume] Failed to store resumeText:', dbErr.message);
  }

  // ── Step 4: respond ───────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    message:  warningMessage
      ? 'Resume uploaded, but text extraction failed.'
      : 'Resume uploaded and text extracted successfully.',
    warning: warningMessage || undefined,
    resume:  user.resume,
    textExtracted: textStatus === 'extracted',
  });
};

// ── POST /api/resume/analyze ─────────────────────────────────────────────────
const analyzeResume = async (req, res) => {
  // ── 1. Load the user and check resumeText exists ──────────────────────────
  let user;
  try {
    user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (err) {
    console.error('[analyzeResume] DB fetch:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }

  if (!user.resumeText || !user.resumeText.trim()) {
    return res.status(400).json({
      success: false,
      message: 'No resume text found. Please upload a readable PDF first.',
    });
  }

  // ── 2. Build the prompt and call Gemini ───────────────────────────────────
  const prompt = buildResumeAnalysisPrompt(user.resumeText);
  let rawResponse;

  try {
    rawResponse = await generateContent(prompt);
  } catch (aiErr) {
    console.error('[analyzeResume] Gemini call failed:', aiErr.message);
    return res.status(502).json({
      success: false,
      message: 'AI service is temporarily unavailable. Please try again shortly.',
    });
  }

  // ── 3. Parse the response — strip fences, retry once on failure ───────────
  let analysis;

  const tryParse = (raw) => {
    const cleaned = stripFences(raw);
    return JSON.parse(cleaned); // throws on invalid JSON
  };

  try {
    analysis = tryParse(rawResponse);
  } catch (_firstErr) {
    console.warn('[analyzeResume] First parse failed — retrying with stricter prompt.');

    const retryPrompt =
      prompt +
      '\n\nIMPORTANT: Your previous response could not be parsed as JSON. ' +
      'Return ONLY raw JSON with no markdown, no code fences, no extra text.';

    let retryRaw;
    try {
      retryRaw = await generateContent(retryPrompt);
      analysis = tryParse(retryRaw);
    } catch (retryErr) {
      console.error('[analyzeResume] Retry parse also failed:', retryErr.message);
      return res.status(502).json({
        success: false,
        message:
          'The AI returned an unreadable response. Please try again — this is usually a one-time glitch.',
      });
    }
  }

  // ── 4. Validate required fields are present ───────────────────────────────
  const REQUIRED = ['atsScore', 'strengths', 'weakPoints', 'missingSkills', 'recommendations'];
  const missing  = REQUIRED.filter((k) => analysis[k] === undefined);
  if (missing.length) {
    console.error('[analyzeResume] Parsed JSON missing fields:', missing);
    return res.status(502).json({
      success: false,
      message: 'AI response was incomplete. Please try again.',
    });
  }

  // ── 5. Persist to User.resumeAnalysis ────────────────────────────────────
  const resumeAnalysis = {
    ...analysis,
    analyzedAt: new Date(),
  };

  try {
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { resumeAnalysis } },
      { new: true, select: '-password' }
    );
  } catch (dbErr) {
    // Non-fatal — analysis is valid, just couldn't persist
    console.error('[analyzeResume] Failed to save resumeAnalysis:', dbErr.message);
  }

  // ── 6. Respond ────────────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    message: 'Resume analysed successfully.',
    resumeAnalysis,
  });
};

module.exports = { uploadResume, analyzeResume };
