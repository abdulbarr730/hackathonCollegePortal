const userService = require('./user.service');

/* ============================================================================
   USER CONTROLLER
   Thin HTTP layer — extracts params from req, calls user.service.js,
   and sends the response.
   Structured errors { status, msg } thrown by the service are forwarded as-is.
============================================================================ */


// ---------------------------------------------------------------------------
// HELPER — forward structured service errors or fall through to 500
// ---------------------------------------------------------------------------
const handleError = (err, res, label) => {
  if (err.status && err.msg) {
    return res.status(err.status).json({ msg: err.msg });
  }
  console.error(`${label}:`, err.message || err);
  res.status(500).send('Server Error');
};


// =============================================================================
// 1. GET CURRENT USER   GET /api/users/me
// =============================================================================
/**
 * Returns the authenticated user already attached by the auth middleware.
 * No DB call needed.
 */
const getMe = (req, res) => {
  try {
    res.json(userService.getMe(req.user));
  } catch (err) {
    handleError(err, res, 'Error in GET /api/users/me');
  }
};


// =============================================================================
// 2. GET ALL USERS   GET /api/users
// =============================================================================
/**
 * Returns all students matching optional query filters.
 * Annotates each result with isInvited if the requester's team has a
 * pending invitation for that user.
 *
 * Query params: year, search, course
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.query, req.user.id);
    res.json(users);
  } catch (err) {
    handleError(err, res, 'Error in GET /api/users');
  }
};


// =============================================================================
// 3. UPDATE PROFILE   PUT /api/users/profile
// =============================================================================
/**
 * Updates editable profile fields (name, email, year, course).
 * Change-count limits are enforced in the service.
 */
const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    handleError(err, res, 'Error in PUT /api/users/profile');
  }
};


// =============================================================================
// 4. UPDATE SOCIAL LINKS   PUT /api/users/social
// =============================================================================
/**
 * Validates and saves the user's social profile links.
 */
const updateSocial = async (req, res) => {
  try {
    const result = await userService.updateSocial(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    handleError(err, res, 'Error in PUT /api/users/social');
  }
};


// =============================================================================
// 5. CHANGE PASSWORD   PUT /api/users/change-password
// =============================================================================
/**
 * Verifies the current password and replaces it with the new one.
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.json(result);
  } catch (err) {
    handleError(err, res, 'Error in PUT /api/users/change-password');
  }
};

// =============================================================================
// 6. UPDATE PHONE   PUT /api/users/update-phone
// =============================================================================

const updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;

    const result = await userService.updatePhone(
      req.user.id,
      phone
    );

    res.json(result);

  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.msg || err.message
    });
  }
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  getMe,
  getAllUsers,
  updateProfile,
  updateSocial,
  changePassword,
  updatePhone,
};