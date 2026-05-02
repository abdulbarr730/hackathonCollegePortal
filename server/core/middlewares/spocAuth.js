const jwt = require('jsonwebtoken');
const User = require('../../modules/users/user.model');

/* ============================================================================
   SPOC MIDDLEWARE (Smart Point of Contact — College Admin)
   Guards routes that only a college admin (SPOC) should access.

   Checks: valid JWT + user exists + role === 'spoc' + has a collegeId

   Usage in routes:
     const spocAuth = require('../../core/middlewares/spocAuth');
     router.post('/hackathons', spocAuth, hackathonController.createHackathon);

   SPOC can:
     - Create / manage hackathons for their college
     - Approve / reject student join requests
     - Verify students
     - Lock teams
     - View all teams and ideas for their college

   SPOC CANNOT:
     - Access another college's data (collegeId is always enforced in services)
     - Approve other colleges
     - Access super admin routes

   Note: Super admins can also access SPOC routes if needed.
   Use spocAuth for college-scoped management endpoints.
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

    // Allow super admins through — they can do everything a SPOC can
    if (user.isAdmin && user.role === 'admin') {
      req.user = user;
      return next();
    }

    // Must be a SPOC with a collegeId
    if (user.role !== 'spoc') {
      return res.status(403).json({ msg: 'SPOC access required' });
    }

    if (!user.collegeId) {
      return res.status(403).json({ msg: 'SPOC is not associated with a college' });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('SPOC MIDDLEWARE ERROR:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};