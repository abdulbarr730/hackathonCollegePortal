const jwt = require('jsonwebtoken');
const User = require('../../modules/users/user.model');

/* ============================================================================
   SUPER ADMIN MIDDLEWARE
   Replaces adminAuth.js.

   Only YOU pass this — the platform owner.
   Checks: valid JWT + user exists + isAdmin === true + role === 'admin'

   Usage in routes:
     const superAdmin = require('../../core/middlewares/superAdmin');
     router.get('/platform-stats', superAdmin, controller.getPlatformStats);

   Super admin can:
     - Approve / reject colleges
     - View all colleges, all hackathons, all teams
     - Manage platform-level settings
     - Access any college's data

   Super admin CANNOT be a SPOC — these are mutually exclusive roles.
============================================================================ */

module.exports = async function (req, res, next) {
  // 1. Extract token
  let token = req.cookies.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId  = decoded.user?.id || decoded._id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ msg: 'User not found, authorization denied' });
    }

    // Must be flagged as admin AND have the admin role
    if (!user.isAdmin || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Super admin access required' });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('SUPER ADMIN MIDDLEWARE ERROR:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};