const express = require('express');
const router  = express.Router();

const protect      = require('../middleware/authMiddleware');
const upload       = require('../middleware/uploadMiddleware');
const { uploadResume, analyzeResume } = require('../controllers/resumeController');

// All resume routes are protected
router.use(protect);

/**
 * POST /api/resume/upload
 *
 * Multer runs first:
 *   - fileFilter rejects non-PDFs  → MulterError / Error 'Only PDF files are accepted.'
 *   - limits.fileSize rejects >5MB → MulterError 'File too large'
 *
 * We wrap multer in a small inline handler so we can return consistent JSON
 * error responses instead of letting Express's default error handler fire.
 */
router.post('/upload', (req, res, next) => {
  const multerSingle = upload.single('resume');

  multerSingle(req, res, (err) => {
    if (err) {
      // Distinguish size limit from everything else
      const isTooBig = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        success: false,
        message: isTooBig
          ? 'File exceeds the 5 MB size limit. Please upload a smaller PDF.'
          : err.message || 'File upload failed.',
      });
    }

    // No file attached at all
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file received. Please attach a PDF under the "resume" field.',
      });
    }

    next(); // hand off to the controller
  });
}, uploadResume);

// POST /api/resume/analyze — run AI analysis on stored resumeText
router.post('/analyze', analyzeResume);

module.exports = router;
