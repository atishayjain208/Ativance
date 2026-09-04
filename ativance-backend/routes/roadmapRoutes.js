const express = require('express');
const router  = express.Router();

const protect = require('../middleware/authMiddleware');
const {
  getLatestRoadmap,
  getSavedRoadmaps,
  toggleSaveRoadmap,
  generateRoadmap,
  toggleDayCompleted,
} = require('../controllers/roadmapController');

// All roadmap routes require a valid JWT
router.use(protect);

// GET  /api/roadmap              — load the user's latest weekly roadmap
router.get('/', getLatestRoadmap);

// GET  /api/roadmap/saved        — get user's saved roadmaps
router.get('/saved', getSavedRoadmaps);

// PATCH /api/roadmap/:id/save    — toggle save status of a roadmap
router.patch('/:id/save', toggleSaveRoadmap);

// POST /api/roadmap/generate     — generate a new AI roadmap
router.post('/generate', generateRoadmap);

// PATCH /api/roadmap/:id/:day/toggle — toggle completion status for a specific day
router.patch('/:id/:day/toggle', toggleDayCompleted);

module.exports = router;
