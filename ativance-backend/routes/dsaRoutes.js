const express = require('express');
const router  = express.Router();

const protect = require('../middleware/authMiddleware');
const {
  getDSAProgress,
  updateDSAProgress,
  analyzeWeakTopics,
  syncLeetcodeStats,
} = require('../controllers/dsaController');

// All DSA routes require a valid JWT
router.use(protect);

// GET  /api/dsa          — fetch the logged-in user's current DSA progress
router.get('/', getDSAProgress);

// POST /api/dsa/update   — submit / update solvedByDifficulty and solvedByTopic (manual)
router.post('/update', updateDSAProgress);

// POST /api/dsa/sync/:username — auto-fetch and sync stats from LeetCode GraphQL
router.post('/sync/:username', syncLeetcodeStats);

// POST /api/dsa/analyze  — detect weak topics and fetch Gemini problem recommendations
router.post('/analyze', analyzeWeakTopics);

module.exports = router;

