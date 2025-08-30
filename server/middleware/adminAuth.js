const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  let token = req.cookies.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user?.id || decoded._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ msg: 'User not found, authorization denied' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ msg: 'Not an admin, authorization denied' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT error (adminAuth):', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
  
};
