const User = require('../models/User');

// ── GET /api/user/profile ─────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[getProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    // Whitelist updatable fields — never let clients touch password/email here
    const { education, skills, targetCompanies, availableStudyHours, goals, name } = req.body;

    const updates = {};
    if (name              !== undefined) updates.name               = name;
    if (education         !== undefined) updates.education          = education;
    if (goals             !== undefined) updates.goals              = goals;
    if (availableStudyHours !== undefined) updates.availableStudyHours = Number(availableStudyHours);

    // Arrays — validate they actually are arrays before assigning
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ success: false, message: '`skills` must be an array.' });
      }
      updates.skills = skills.map((s) => s.trim()).filter(Boolean);
    }
    if (targetCompanies !== undefined) {
      if (!Array.isArray(targetCompanies)) {
        return res.status(400).json({ success: false, message: '`targetCompanies` must be an array.' });
      }
      updates.targetCompanies = targetCompanies.map((c) => c.trim()).filter(Boolean);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Keep localStorage in sync — return same shape as auth endpoints
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (err) {
    console.error('[updateProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getProfile, updateProfile };
