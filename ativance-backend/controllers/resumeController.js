const path   = require('path');
const User   = require('../models/User');
const { extractTextFromPDF } = require('../utils/pdfParser');

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

module.exports = { uploadResume };
