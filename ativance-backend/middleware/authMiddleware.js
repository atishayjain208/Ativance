const jwt = require('jsonwebtoken');

/**
 * protect — verifies a Bearer JWT in the Authorization header.
 *
 * On success: attaches { id } to req.user and calls next().
 * On failure: responds immediately with 401 and a descriptive message.
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Ensure the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided. Please log in.',
      });
    }

    // 2. Extract the token part
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed authorization header.',
      });
    }

    // 3. Verify — jwt.verify throws on invalid/expired tokens
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach minimal payload to req so route handlers can use it
    req.user = { id: decoded.id };

    next();
  } catch (err) {
    // Distinguish between expiry and any other verification failure
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
};

module.exports = protect;
