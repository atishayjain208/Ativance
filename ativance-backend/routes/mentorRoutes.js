const express = require('express');
const router  = express.Router();

const protect = require('../middleware/authMiddleware');
const { chatWithMentor, getMentorHistory } = require('../controllers/mentorController');

// All mentor chat routes require a valid JWT
router.use(protect);

// GET  /api/mentor        — load previous chat messages
router.get('/', getMentorHistory);

// POST /api/mentor/chat   — ask the AI Mentor a question
router.post('/chat', chatWithMentor);

module.exports = router;
