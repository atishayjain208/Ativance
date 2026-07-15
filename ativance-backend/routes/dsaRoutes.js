const express = require('express');
const router  = express.Router();

const protect = require('../middleware/authMiddleware');
const { getDSAProgress, updateDSAProgress } = require('../controllers/dsaController');

// All DSA routes require a valid JWT
router.use(protect);

// GET  /api/dsa          — fetch the logged-in user's current DSA progress
router.get('/', getDSAProgress);

// POST /api/dsa/update   — submit / update solvedByDifficulty and solvedByTopic
router.post('/update', updateDSAProgress);

module.exports = router;
