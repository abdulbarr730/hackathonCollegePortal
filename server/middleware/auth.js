const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  // First check for cookie-based token
  let token = req.cookies.token;

  // If not found, check Authorization header (Bearer)
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If your payload is { user: { id } }, use that
    const userId = decoded.user?.id || decoded._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ msg: 'User not found, authorization denied' });
    }

    req.user = user; // attach full user to req
    next();
  } catch (err) {
    console.error('AUTH MIDDLEWARE ERROR:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
