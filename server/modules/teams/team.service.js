const Team = require('./team.model');
const Hackathon = require('../hackathons/hackathon.model');
const User = require('../users/user.model');
const Invitation = require('./invitation.model');
const withTransaction = require('../../shared/utils/withTransaction');
const cloudinary = require('../../shared/services/cloudinary.service');
const rules = require('./team.rules');

/* ============================================================================
   TEAM SERVICE
   Pure business logic — no req/res. Called by team.controller.js.
   Rule validation is delegated to team.rules.js (ensureNotSubmitted,
   validateTeamSize, validateGenderRequirement, validateDeadline).
   Other errors are thrown as { status, msg } so the controller can forward
   them straight to the client.
============================================================================ */


// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Throw a structured HTTP-style error */
const fail = (status, msg) => { throw { status, msg }; };

/** Upload a file buffer to Cloudinary */
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/** Delete an asset from Cloudinary by its public_id */
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Build a normalised rules object from a hackathon document.
 * Falls back to safe defaults when no hackathon is attached.
 * This is the single place where hackathon fields are mapped to rule names,
 * so team.rules.js always receives consistently-named properties.
 */
const buildRules = (hackathon) => ({
  minFemaleMembers:   hackathon?.minFemaleMembers   ?? 0,
  maxTeamSize:        hackathon?.maxTeamSize         ?? 6,
  minTeamSize:        hackathon?.minTeamSize         ?? 1,
  submissionDeadline: hackathon?.submissionDeadline  ?? null,
});


// =============================================================================
// 1. CREATE TEAM (scoped to the active hackathon)
// =============================================================================
/**
 * Creates a new team and assigns the creator as leader & first member.
 *
 * Checks (in order):
 *  1. An active hackathon must exist
 *  2. Caller must NOT already be in a team for this hackathon
 *  3. Team name must be unique within this hackathon (case-insensitive)
 *  4. Optional logo upload to Cloudinary
 *
 * Runs inside a transaction because we write to both Team and User.
 *
 * @param {object}      fields     - { teamName, problemStatementTitle, problemStatementDescription }
 * @param {string}      userId     - req.user.id
 * @param {Buffer|null} fileBuffer - uploaded logo buffer (or null)
 * @returns {Promise<Team>}
 */
const createTeam = async (fields, userId, fileBuffer = null) => {
  const { teamName, problemStatementTitle, problemStatementDescription } = fields;

  if (!teamName) fail(400, 'Team name is required.');

  return withTransaction(async (session) => {

    // ── 1. Active hackathon ──────────────────────────────────────────────────
    const activeHackathon = await Hackathon.findOne({ isActive: true }).session(session);
    if (!activeHackathon) {
      fail(400, 'No active hackathon found. Cannot create a team.');
    }

    const user = await User.findById(userId).session(session);

    // ── 2. Smart check — already a member of a team for this event? ──────────
    // We query the Team collection directly rather than trusting user.team alone,
    // because user.team might point to a team from a previous hackathon.
    const existingTeamForThisEvent = await Team.findOne({
      hackathonId: activeHackathon._id,
      members:     userId,
    }).session(session);

    if (existingTeamForThisEvent) {
      fail(400,
        `You are already in team "${existingTeamForThisEvent.teamName}" ` +
        `for the ${activeHackathon.name} event.`
      );
    }

    // ── 3. Name uniqueness within this hackathon (case-insensitive) ──────────
    const nameTaken = await Team.findOne({
      teamName:    { $regex: new RegExp(`^${teamName}$`, 'i') },
      hackathonId: activeHackathon._id,
    }).session(session);

    if (nameTaken) {
      fail(400, `Team name "${teamName}" is already taken in this hackathon.`);
    }

    // ── 4. Build team fields ─────────────────────────────────────────────────
    const teamFields = {
      teamName,
      problemStatementTitle,
      problemStatementDescription,
      leader:      userId,
      members:     [userId],
      hackathonId: activeHackathon._id,
    };

    // Optional logo upload — done BEFORE saving so the team doc is complete
    if (fileBuffer) {
      const cloudinaryResult = await uploadToCloudinary(fileBuffer);
      teamFields.logoUrl      = cloudinaryResult.secure_url;
      teamFields.logoPublicId = cloudinaryResult.public_id;
    }

    const team = new Team(teamFields);
    await team.save({ session });

    // ── 5. Point user.team to new team ───────────────────────────────────────
    // The old team connection is preserved in that team's members array.
    user.team = team.id;
    await user.save({ session });

    return team;
  });
};


// =============================================================================
// 2. GET ALL TEAMS (filtered to the active hackathon)
// =============================================================================
/**
 * Returns every team that belongs to the currently active hackathon.
 * Returns [] when no hackathon is active.
 *
 * @returns {Promise<Team[]>}
 */
const getAllTeams = async () => {
  const activeHackathon = await Hackathon.findOne({ isActive: true });

  if (!activeHackathon) return [];

  const teams = await Team.find({ hackathonId: activeHackathon._id })
    .populate('leader',          'name email photoUrl socialProfiles course year')
    .populate('members',         'name email photoUrl socialProfiles course year')
    .populate('pendingRequests', 'name email photoUrl socialProfiles course year');

  return teams;
};


// =============================================================================
// 3. GET MY TEAM
// =============================================================================
/**
 * Returns the team the authenticated user currently belongs to,
 * fully populated with members, leader, and hackathon rules.
 * Returns null if the user has no team.
 *
 * @param {string} userId - req.user.id
 * @returns {Promise<Team|null>}
 */
const getMyTeam = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'team',
    populate: [
      { path: 'members',    select: 'name email gender photoUrl socialProfiles course year' },
      { path: 'leader',     select: 'name email gender photoUrl socialProfiles course year' },
      { path: 'hackathonId' }, // Frontend needs this to enforce rules client-side
    ],
  });

  return user.team || null;
};


// =============================================================================
// 4. GET TEAM BY ID
// =============================================================================
/**
 * Returns a single team document fully populated.
 *
 * @param {string} teamId
 * @returns {Promise<Team>}
 */
const getTeamById = async (teamId) => {
  const team = await Team.findById(teamId)
    .populate('leader',          'name email photoUrl socialProfiles course year')
    .populate('members',         'name email photoUrl socialProfiles course year')
    .populate('pendingRequests', 'name email photoUrl socialProfiles course year')
    .populate('hackathonId');

  if (!team) fail(404, 'Team not found');

  return team;
};


// =============================================================================
// 5. UPDATE TEAM DETAILS (blocked when locked)
// =============================================================================
/**
 * Updates team name, problem statement, and optionally swaps the logo.
 * Uses rules.ensureNotSubmitted to block edits on locked teams.
 *
 * @param {string}      teamId
 * @param {object}      fields     - { teamName, problemStatementTitle, problemStatementDescription }
 * @param {string}      userId     - req.user.id (must be leader)
 * @param {Buffer|null} fileBuffer - new logo buffer, or null to keep existing
 * @returns {Promise<Team>}
 */
const updateTeam = async (teamId, fields, userId, fileBuffer = null) => {
  const { teamName, problemStatementTitle, problemStatementDescription } = fields;

  let team = await Team.findById(teamId);
  if (!team)                               fail(404, 'Team not found');
  if (team.leader.toString() !== userId)   fail(401, 'User not authorized');

  // ── Lock check via team.rules ────────────────────────────────────────────
  rules.ensureNotSubmitted(team);

  // Swap logo if a new file was uploaded
  if (fileBuffer) {
    if (team.logoPublicId) await deleteFromCloudinary(team.logoPublicId);
    const cloudinaryResult = await uploadToCloudinary(fileBuffer);
    team.logoUrl      = cloudinaryResult.secure_url;
    team.logoPublicId = cloudinaryResult.public_id;
  }

  team.teamName                    = teamName;
  team.problemStatementTitle       = problemStatementTitle;
  team.problemStatementDescription = problemStatementDescription;

  await team.save();
  return team;
};


// =============================================================================
// 6. DELETE TEAM (blocked when locked)
// =============================================================================
/**
 * Deletes the team, its Cloudinary logo, all related invitations,
 * and clears the team pointer on every member's User document.
 *
 * Uses rules.ensureNotSubmitted to block deletion of locked teams.
 * Runs inside a transaction because multiple collections are modified.
 *
 * @param {string} teamId
 * @param {string} userId - req.user.id (must be leader)
 * @returns {Promise<{ msg: string }>}
 */
const deleteTeam = async (teamId, userId) => {
  // Fetch & validate outside the transaction — avoids holding a session open
  // during the Cloudinary external call
  const team = await Team.findById(teamId);
  if (!team)                               fail(404, 'Team not found');
  if (team.leader.toString() !== userId)   fail(401, 'User not authorized');

  // ── Lock check via team.rules ────────────────────────────────────────────
  rules.ensureNotSubmitted(team);

  // Delete logo from Cloudinary (external — intentionally outside transaction)
  if (team.logoPublicId) await deleteFromCloudinary(team.logoPublicId);

  return withTransaction(async (session) => {
    // Remove all pending invitations for this team
    await Invitation.deleteMany({ teamId: team._id }, { session });

    // Clear team pointer from every member's User doc
    await User.updateMany(
      { _id: { $in: team.members } },
      { $unset: { team: '' } },
      { session }
    );

    await team.deleteOne({ session });

    return { msg: 'Team removed' };
  });
};


// =============================================================================
// 7. SEND JOIN REQUEST
// =============================================================================
/**
 * Adds the caller to team.pendingRequests.
 *
 * Uses rules.ensureNotSubmitted and rules.validateTeamSize.
 *
 * @param {string} teamId
 * @param {string} userId - req.user.id
 * @returns {Promise<Team>}
 */
const sendJoinRequest = async (teamId, userId) => {
  const team = await Team.findById(teamId)
    .populate('members', 'gender')
    .populate('hackathonId');

  if (!team) fail(404, 'Team not found');

  // ── Lock check via team.rules ────────────────────────────────────────────
  rules.ensureNotSubmitted(team);

  // ── Size check via team.rules ────────────────────────────────────────────
  const hackathonRules = buildRules(team.hackathonId);
  rules.validateTeamSize(team, hackathonRules.maxTeamSize);

  const user = await User.findById(userId);
  if (user.team) fail(400, 'You are already in a team.');

  const alreadyRequested = team.pendingRequests
    .map((id) => id.toString())
    .includes(user._id.toString());

  if (alreadyRequested) {
    fail(400, 'You have already sent a request to join this team.');
  }

  team.pendingRequests.push(userId);
  await team.save();

  return team;
};


// =============================================================================
// 8. CANCEL JOIN REQUEST
// =============================================================================
/**
 * Removes the caller from team.pendingRequests.
 *
 * @param {string} teamId
 * @param {string} userId - req.user.id
 * @returns {Promise<{ ok: boolean, msg: string }>}
 */
const cancelJoinRequest = async (teamId, userId) => {
  await Team.updateOne(
    { _id: teamId },
    { $pull: { pendingRequests: userId } }
  );
  return { ok: true, msg: 'Request cancelled.' };
};


// =============================================================================
// 9. APPROVE JOIN REQUEST (with diversity check + invitation cleanup)
// =============================================================================
/**
 * Leader approves a pending join request.
 *
 * Uses rules.ensureNotSubmitted, rules.validateTeamSize,
 * and rules.validateGenderRequirement.
 *
 * On success:
 *  1. Adds user to team.members
 *  2. Removes them from team.pendingRequests
 *  3. Sets user.team
 *  4. Deletes any pending invitation between this user and this team (ghost-buster)
 *
 * Runs inside a transaction.
 *
 * @param {string} teamId
 * @param {string} userToApproveId - the user being approved
 * @param {string} leaderId        - req.user.id
 * @returns {Promise<Team>}
 */
const approveJoinRequest = async (teamId, userToApproveId, leaderId) => {
  return withTransaction(async (session) => {

    const team = await Team.findById(teamId)
      .populate('members', 'gender')
      .populate('hackathonId')
      .session(session);

    if (!team)                               fail(404, 'Team not found');
    if (team.leader.toString() !== leaderId) fail(401, 'User not authorized');

    // ── Lock check via team.rules ──────────────────────────────────────────
    rules.ensureNotSubmitted(team);

    const hackathonRules = buildRules(team.hackathonId);

    // ── Size check via team.rules ──────────────────────────────────────────
    rules.validateTeamSize(team, hackathonRules.maxTeamSize);

    // Pull fresh user data — verify they're still available
    const userToApprove = await User.findById(userToApproveId).session(session);

    if (!userToApprove || userToApprove.team) {
      // Clean up stale request before bailing
      await Team.updateOne(
        { _id: teamId },
        { $pull: { pendingRequests: userToApproveId } },
        { session }
      );
      fail(400, 'User is no longer available to join.');
    }

    // ── Gender / diversity check via team.rules ────────────────────────────
    rules.validateGenderRequirement(team, userToApprove, hackathonRules);

    // ── 1. Update team roster ────────────────────────────────────────────────
    team.members.push(userToApproveId);
    team.pendingRequests = team.pendingRequests.filter(
      (id) => id.toString() !== userToApproveId
    );
    await team.save({ session });

    // ── 2. Update user profile ───────────────────────────────────────────────
    userToApprove.team = teamId;
    await userToApprove.save({ session });

    // ── 3. Ghost-buster — delete any invite between this user & this team ────
    await Invitation.deleteMany(
      { inviteeId: userToApproveId, teamId },
      { session }
    );

    return team;
  });
};


// =============================================================================
// 10. REJECT JOIN REQUEST
// =============================================================================
/**
 * Leader rejects a pending join request by pulling the user from pendingRequests.
 *
 * @param {string} teamId
 * @param {string} userToRejectId
 * @param {string} leaderId - req.user.id
 * @returns {Promise<{ msg: string }>}
 */
const rejectJoinRequest = async (teamId, userToRejectId, leaderId) => {
  await Team.updateOne(
    { _id: teamId, leader: leaderId },
    { $pull: { pendingRequests: userToRejectId } }
  );
  return { msg: 'Request rejected.' };
};


// =============================================================================
// 11. LEAVE TEAM (blocked when locked)
// =============================================================================
/**
 * Removes the authenticated user from their current team.
 * The team leader cannot leave — they must delete the team instead.
 * Uses rules.ensureNotSubmitted.
 *
 * @param {string} userId - req.user.id
 * @returns {Promise<{ msg: string }>}
 */
const leaveTeam = async (userId) => {
  const user = await User.findById(userId).select('team').lean();

  if (!user.team) fail(400, 'You are not in a team.');

  const team = await Team.findById(user.team);

  // ── Lock check via team.rules ────────────────────────────────────────────
  rules.ensureNotSubmitted(team);

  // $ne: userId ensures the leader cannot accidentally match and remove themselves
  const result = await Team.updateOne(
    { _id: user.team, leader: { $ne: userId } },
    { $pull: { members: userId } }
  );

  if (result.nModified === 0) {
    if (team.leader.toString() === userId) {
      fail(400, 'Team leader cannot leave; delete the team instead.');
    }
  }

  await User.updateOne({ _id: userId }, { $unset: { team: '' } });

  return { msg: 'You have left the team.' };
};


// =============================================================================
// 12. REMOVE MEMBER (blocked when locked)
// =============================================================================
/**
 * Leader forcibly removes a member from the team.
 * Uses rules.ensureNotSubmitted.
 *
 * @param {string} teamId
 * @param {string} memberId   - the member being removed
 * @param {string} leaderId   - req.user.id (must be leader)
 * @returns {Promise<{ msg: string }>}
 */
const removeMember = async (teamId, memberId, leaderId) => {
  // Leader cannot remove themselves
  if (leaderId === memberId) {
    fail(400, 'Team leader cannot remove themselves. Delete the team instead.');
  }

  const team = await Team.findById(teamId);
  if (!team)                               fail(404, 'Team not found');
  if (team.leader.toString() !== leaderId) fail(401, 'Unauthorized. Only the leader can manage members.');

  // ── Lock check via team.rules ────────────────────────────────────────────
  rules.ensureNotSubmitted(team);

  const result = await Team.updateOne(
    { _id: teamId },
    { $pull: { members: memberId } }
  );

  if (result.modifiedCount === 0) {
    fail(400, 'Member not found in this team.');
  }

  await User.updateOne({ _id: memberId }, { $set: { team: null } });

  return { msg: 'Member removed successfully.' };
};


// =============================================================================
// 13. REMOVE LOGO (blocked when locked)
// =============================================================================
/**
 * Deletes the team logo from Cloudinary and clears the logo fields on the team.
 * Uses rules.ensureNotSubmitted.
 *
 * @param {string} teamId
 * @param {string} userId - req.user.id (must be leader)
 * @returns {Promise<Team>}
 */
const removeLogo = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team)                               fail(404, 'Team not found');
  if (team.leader.toString() !== userId)   fail(401, 'User not authorized');

  // ── Lock check via team.rules ────────────────────────────────────────────
  rules.ensureNotSubmitted(team);

  if (team.logoPublicId) await deleteFromCloudinary(team.logoPublicId);

  team.logoUrl      = '';
  team.logoPublicId = '';
  await team.save();

  return team;
};


// =============================================================================
// 14. SUBMIT TEAM (lock) — checks size, gender rules & deadline
// =============================================================================
/**
 * Validates all submission rules then sets team.isSubmitted = true.
 *
 * Delegates rule checks to team.rules:
 *  - rules.validateDeadline          — submission window still open
 *  - rules.validateGenderRequirement — female quota met at final roster
 *
 * Min team size is checked directly here (validateTeamSize checks for full,
 * not for minimum, so we handle the minimum case inline).
 *
 * @param {string} teamId
 * @param {string} userId - req.user.id (must be leader)
 * @returns {Promise<{ msg: string, team: Team }>}
 */
const submitTeam = async (teamId, userId) => {
  const team = await Team.findById(teamId)
    .populate('members', 'gender name')
    .populate('hackathonId');

  if (!team) fail(404, 'Team not found');

  // ── Security ─────────────────────────────────────────────────────────────
  if (team.leader.toString() !== userId) {
    fail(401, 'Only the Team Leader can submit.');
  }

  if (team.isSubmitted) {
    fail(400, 'Team is already submitted and locked.');
  }

  const hackathonRules = buildRules(team.hackathonId);

  // ── Deadline check via team.rules ─────────────────────────────────────────
  rules.validateDeadline(hackathonRules.submissionDeadline);

  // ── Min team size check (max is enforced at join/approve time) ────────────
  if (team.members.length < hackathonRules.minTeamSize) {
    fail(400,
      `Team size invalid. Need at least ${hackathonRules.minTeamSize} member(s) ` +
      `(currently ${team.members.length}).`
    );
  }

  // ── Gender / diversity check via team.rules ───────────────────────────────
  // At submission we validate the full existing roster rather than an incoming
  // user, so we count females directly and compare to the required minimum.
  const femaleCount = team.members.filter(
    (m) => m.gender && ['female', 'f'].includes(m.gender.toLowerCase())
  ).length;

  if (femaleCount < hackathonRules.minFemaleMembers) {
    fail(400,
      `Diversity Rule Violation: You need at least ${hackathonRules.minFemaleMembers} ` +
      `female member(s) (currently ${femaleCount}).`
    );
  }

  // ── Lock the team ─────────────────────────────────────────────────────────
  team.isSubmitted     = true;
  team.pendingRequests = []; // Clear all pending requests on lock
  await team.save();

  return { msg: 'Team submitted successfully!', team };
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  createTeam,
  getAllTeams,
  getMyTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  sendJoinRequest,
  cancelJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  leaveTeam,
  removeMember,
  removeLogo,
  submitTeam,
};