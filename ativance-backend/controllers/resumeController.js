const path = require('path');
const User = require('../models/User');

// ── POST /api/resume/upload ───────────────────────────────────────────────────
const uploadResume = async (req, res) => {
  try {
    // multer has already validated mime-type, size, and saved the file.
    // req.file is guaranteed to exist at this point (route handles missing-file case).
    const filePath     = path.join('uploads', req.file.filename); // relative, OS-agnostic
    const uploadedAt   = new Date();

    // Persist to User document
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'resume.filePath':   filePath,
          'resume.filename':   req.file.filename,
          'resume.uploadedAt': uploadedAt,
        },
      },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully.',
      resume: user.resume,
    });
  } catch (err) {
    console.error('[uploadResume]', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { uploadResume };
