const express = require('express');
const router  = express.Router();

const protect = require('../middleware/authMiddleware');
const { startInterview, nextInterviewQuestion } = require('../controllers/interviewController');

// All interview simulator routes require a valid JWT
router.use(protect);

// POST /api/interview/start — start a new interview session and get opening question
router.post('/start', startInterview);

// POST /api/interview/next  — submit candidate's answer and get the next follow-up
router.post('/next', nextInterviewQuestion);

module.exports = router;
