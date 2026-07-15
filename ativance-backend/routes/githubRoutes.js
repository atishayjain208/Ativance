const express = require('express');
const router  = express.Router();

const protect          = require('../middleware/authMiddleware');
const { analyzeGithub } = require('../controllers/githubController');

// All GitHub routes require a valid JWT
router.use(protect);

/**
 * GET /api/github/analyze/:username
 *
 * Fetches and aggregates a GitHub user's public repo data:
 *   - Profile metadata (name, avatar, public repo count)
 *   - Language breakdown across all non-forked repos
 *   - Per-repo README and description health flags
 *
 * Saves the result to User.githubStats and returns it in the response.
 *
 * ⚠️  This endpoint makes 2 + N*2 GitHub API calls (N = non-forked repo count).
 *   With the unauthenticated 60 req/hour limit it should be used sparingly.
 */
router.get('/analyze/:username', analyzeGithub);

module.exports = router;
