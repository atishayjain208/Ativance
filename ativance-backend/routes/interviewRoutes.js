const express = require('express');
const router  = express.Router();

const protect = require('../middleware/authMiddleware');
const {
  startInterview,
  nextInterviewQuestion,
  evaluateInterview,
} = require('../controllers/interviewController');

// All interview simulator routes require a valid JWT
router.use(protect);

// POST /api/interview/start    — start session
router.post('/start', startInterview);

// POST /api/interview/next     — answer question
router.post('/next', nextInterviewQuestion);

// POST /api/interview/evaluate — get final scores and question-by-question tips
router.post('/evaluate', evaluateInterview);

module.exports = router;

