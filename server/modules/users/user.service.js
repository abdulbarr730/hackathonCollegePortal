const bcrypt = require('bcryptjs');
const User = require('./user.model');
const Invitation = require('../teams/invitation.model');
const { validateSocial } = require('../../shared/utils/validators');

/* ============================================================================
   USER SERVICE
   Pure business logic — no req/res. Called by user.controller.js.
   Throws plain Error instances so the controller can map them to the right
   HTTP status.
   No transactions needed — every operation is a single document write.
============================================================================ */


// ---------------------------------------------------------------------------
// HELPER
// ---------------------------------------------------------------------------
const fail = (status, msg) => { throw { status, msg }; };


// =============================================================================
// 1. GET CURRENT USER
// =============================================================================
/**
 * Returns the user object already attached to req by the auth middleware.
 * No DB call needed — the middleware populates req.user.
 *
 * @param {object} user - req.user
 * @returns {object}
 */
const getMe = (user) => user;


// =============================================================================
// 2. GET ALL USERS (with optional filters + invite status)
// =============================================================================
/**
 * Returns all students matching the optional filters.
 * If the requesting user is in a team, each result is annotated with
 * `isInvited: true` when a pending invitation already exists for that user.
 *
 * @param {object} query      - { year, search, course } from req.query
 * @param {string} requesterId - req.user.id
 * @returns {Promise<User[]>}
 */
const getAllUsers = async (query, requesterId) => {
  const { year, search, course } = query;

  // Only return student accounts
  const filter = { role: 'student' };

  if (year)   filter.year   = Number(year);
  if (course) filter.course = course;
  if (search) {
    filter.$or = [
      { name:  new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  const users = await User.find(filter)
    .select('name email year course photoUrl team socialProfiles isVerified role');

  // Annotate each user with whether the requester's team has already invited them
  const currentUser = await User.findById(requesterId).populate('team');

  if (currentUser.team) {
    const pendingInvites = await Invitation.find({
      teamId: currentUser.team._id,
      status: 'pending',
    }).select('inviteeId').lean();

    const inviteeIds = new Set(pendingInvites.map((i) => i.inviteeId.toString()));
    users.forEach((u) => { u.isInvited = inviteeIds.has(u._id.toString()); });
  } else {
    users.forEach((u) => { u.isInvited = false; });
  }

  return users;
};


// =============================================================================
// 3. UPDATE PROFILE (name, email, year, course — with change-count limits)
// =============================================================================
/**
 * Updates editable profile fields with the following limits:
 *   name   — max 2 changes
 *   course — max 4 changes
 *   year   — max 4 changes
 *   email  — unlimited but must be unique
 *
 * @param {string} userId - req.user.id
 * @param {object} fields - { name, email, year, course }
 * @returns {Promise<User>}
 */
const updateProfile = async (userId, fields) => {
  const { name, email, year, course } = fields;

  const user = await User.findById(userId);

  // ── Name ──────────────────────────────────────────────────────────────────
  if (name && name !== user.name) {
    if (user.nameUpdateCount >= 2) {
      fail(403, 'You can no longer change your name.');
    }
    user.name = name;
    user.nameUpdateCount += 1;
  }

  // ── Course ────────────────────────────────────────────────────────────────
  if (course && course !== user.course) {
    if (user.courseUpdateCount >= 4) {
      fail(403, 'You can no longer change your course.');
    }
    user.course = course;
    user.courseUpdateCount += 1;
  }

  // ── Year ──────────────────────────────────────────────────────────────────
  if (year && year !== user.year) {
    if (user.yearUpdateCount >= 4) {
      fail(403, 'You can no longer change your academic year.');
    }
    user.year = year;
    user.yearUpdateCount += 1;
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists.id !== user.id) {
      fail(400, 'Email is already in use.');
    }
    user.email = email;
  }

  await user.save();
  return user;
};


// =============================================================================
// 4. UPDATE SOCIAL LINKS
// =============================================================================
/**
 * Validates and saves the user's social profile links.
 * Validation is handled by the shared validateSocial utility.
 *
 * @param {string} userId - req.user.id
 * @param {object} body   - req.body (raw social links object)
 * @returns {Promise<{ msg: string, socialProfiles: object }>}
 */
const updateSocial = async (userId, body) => {
  // validateSocial returns only the filled + valid keys, throws on bad URLs
  const filled = validateSocial(body || {});

  // All known platforms — any key NOT in filled must be cleared from the DB
  const ALL_PLATFORMS = [
    'linkedin', 'github', 'leetcode', 'geeksforgeeks', 'stackoverflow',
    'hackerrank', 'kaggle', 'codeforces', 'codechef', 'devto', 'medium', 'website',
  ];

  // Build $set for filled fields and $unset for empty ones
  const $set   = {};
  const $unset = {};

  for (const platform of ALL_PLATFORMS) {
    if (filled[platform]) {
      $set[`socialProfiles.${platform}`] = filled[platform];
    } else {
      $unset[`socialProfiles.${platform}`] = '';
    }
  }

  const mongoOp = {};
  if (Object.keys($set).length)   mongoOp.$set   = $set;
  if (Object.keys($unset).length) mongoOp.$unset = $unset;

  const user = await User.findByIdAndUpdate(
    userId,
    mongoOp,
    { new: true, select: '-password' }
  );

  return { msg: 'Social links saved', socialProfiles: user.socialProfiles };
};


// =============================================================================
// 5. CHANGE PASSWORD
// =============================================================================
/**
 * Verifies the current password then replaces it with the new one.
 *
 * @param {string} userId          - req.user.id
 * @param {string} currentPassword - Plain-text current password
 * @param {string} newPassword     - Plain-text new password
 * @returns {Promise<{ msg: string }>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) fail(400, 'Incorrect current password.');

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return { msg: 'Password updated successfully.' };
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
};