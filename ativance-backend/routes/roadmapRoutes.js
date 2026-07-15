const express = require('express');
const router  = express.Router();

const protect = require('../middleware/authMiddleware');
const {
  getLatestRoadmap,
  generateRoadmap,
  toggleDayCompleted,
} = require('../controllers/roadmapController');

// All roadmap routes require a valid JWT
router.use(protect);

// GET  /api/roadmap              — load the user's latest weekly roadmap
router.get('/', getLatestRoadmap);

// POST /api/roadmap/generate     — generate a new AI roadmap
router.post('/generate', generateRoadmap);

// PATCH /api/roadmap/:day/toggle — toggle completion status for a specific day
router.patch('/:day/toggle', toggleDayCompleted);

module.exports = router;
