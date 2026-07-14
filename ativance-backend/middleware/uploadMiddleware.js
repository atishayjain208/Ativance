const multer = require('multer');
const path = require('path');

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Storage: local /uploads, filename = <userId>_<timestamp>.pdf ─────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const userId    = req.user.id;
    const timestamp = Date.now();
    const ext       = path.extname(file.originalname).toLowerCase(); // always .pdf after filter
    cb(null, `${userId}_${timestamp}${ext}`);
  },
});

// ── File filter: reject anything that is not application/pdf ─────────────────
const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are accepted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

module.exports = upload;
