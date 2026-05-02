const ApiError = require('../utils/ApiError');

module.exports = (req, res, next) => {
  if (req.user?.isAdmin || req.user?.role === 'admin') {
    return next();
  }

  if (req.user && req.user.mustAddPhone) {
    return next(new ApiError(403, "Phone number required before continuing"));
  }
  next();
};
