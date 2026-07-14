const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/userController');

// All routes here require a valid JWT
router.use(protect);

// GET  /api/user/profile  — fetch logged-in user's profile
router.get('/profile', getProfile);

// PUT  /api/user/profile  — update editable profile fields
router.put('/profile', updateProfile);

module.exports = router;
