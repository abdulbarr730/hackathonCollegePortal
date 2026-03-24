const Invitation = require('./invitation.model');
const Team = require('./team.model');
const User = require('../users/user.model');
const Hackathon = require('../hackathons/hackathon.model');
const withTransaction = require('../../shared/utils/withTransaction');
const rules = require('./team.rules');

/* ============================================================================
   INVITATION SERVICE
   Pure business logic — no req/res. Called by invitation.controller.js.
   Rule validation (lock, size, gender) is delegated to team.rules.js.
   Other errors are thrown as { status, msg } so the controller can forward
   them straight to the client.
============================================================================ */


// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Throw a structured HTTP-style error */
const fail = (status, msg) => { throw { status, msg }; };

/**
 * Build a normalised rules object from a hackathon document.
 * Falls back to safe defaults when no hackathon is attached.
 */
const buildRules = (hackathon) => ({
  minFemaleMembers: hackathon?.minFemaleMembers ?? 0,
  maxTeamSize:      hackathon?.maxTeamSize      ?? 6,
});


// =============================================================================
// 1. SEND INVITATION
// =============================================================================
/**
 * Validates all rules and creates a new pending Invitation document.
 *
 * Rules checked (in order):
 *  A. Team exists & caller is the leader
 *  B. rules.ensureNotSubmitted  — team is not locked
 *  C. Dynamic slot limit        — members + pending invites < maxTeamSize
 *  D. Invitee exists
 *  E. Smart check               — invitee not already in a team for the ACTIVE hackathon
 *  F. No duplicate pending invite to the same user for the same team
 *
 * Runs inside a transaction.
 *
 * @param {string} teamId    - ID of the team the leader wants to invite to
 * @param {string} inviteeId - ID of the user being invited
 * @param {string} leaderId  - req.user.id (authenticated caller)
 * @returns {Promise<Invitation>} The saved invitation document
 */
const sendInvitation = async (teamId, inviteeId, leaderId) => {
  return withTransaction(async (session) => {

    // ── A. Validate team & permissions ───────────────────────────────────────
    const team = await Team.findById(teamId)
      .populate('hackathonId')
      .session(session);

    if (!team) fail(404, 'Team not found');

    if (team.leader.toString() !== leaderId) {
      fail(401, 'Only the Team Leader can send invites.');
    }

    // ── B. Lock check via team.rules ─────────────────────────────────────────
    rules.ensureNotSubmitted(team);

    // ── C. Dynamic slot limit ────────────────────────────────────────────────
    // Each pending invite "reserves" a future slot, so we count both.
    const hackathonRules = buildRules(team.hackathonId);
    const currentMembers = team.members.length;

    const pendingInvites = await Invitation.countDocuments(
      { teamId: team._id, status: 'pending' },
      { session }
    );

    if (currentMembers + pendingInvites >= hackathonRules.maxTeamSize) {
      fail(400,
        `Team limit reached! (${currentMembers} joined + ${pendingInvites} invited = ` +
        `${currentMembers + pendingInvites}/${hackathonRules.maxTeamSize})`
      );
    }

    // ── D. Validate invitee ──────────────────────────────────────────────────
    const invitee = await User.findById(inviteeId)
      .populate('team')
      .session(session);

    if (!invitee) fail(404, 'User not found');

    // ── E. Smart check — already in a team for THIS active hackathon? ────────
    // Only block if the invitee's current team belongs to the ACTIVE event.
    // Old teams from previous hackathons are ignored.
    if (invitee.team) {
      const activeHackathon = await Hackathon.findOne({ isActive: true }).session(session);

      if (activeHackathon) {
        const inviteeTeam = await Team.findById(
          invitee.team._id || invitee.team
        ).session(session);

        if (
          inviteeTeam &&
          inviteeTeam.hackathonId.toString() === activeHackathon._id.toString()
        ) {
          fail(400, 'User is already in a team for this active event.');
        }
      }
    }

    // ── F. Prevent duplicate pending invite ──────────────────────────────────
    const existingInvite = await Invitation.findOne({
      teamId:    team._id,
      inviteeId: invitee._id,
      status:    'pending',
    }).session(session);

    if (existingInvite) {
      fail(400, 'Invitation already sent to this user.');
    }

    // ── Create & persist the invitation ──────────────────────────────────────
    const invitation = new Invitation({
      inviter:   leaderId,
      inviteeId,
      teamId,
      status:    'pending',
    });

    await invitation.save({ session });
    return invitation;
  });
};


// =============================================================================
// 2. GET SENT INVITATIONS (for the team led by the caller)
// =============================================================================
/**
 * Returns all PENDING invites sent out by the team that the caller leads.
 * If the caller does not lead a team, returns an empty array.
 *
 * @param {string} leaderId - req.user.id
 * @returns {Promise<Invitation[]>}
 */
const getSentInvitations = async (leaderId) => {
  // Sort desc to get the most recently created team in case of edge-case duplicates
  const team = await Team.findOne({ leader: leaderId }).sort({ createdAt: -1 });

  if (!team) return [];

  const invites = await Invitation.find({ teamId: team._id, status: 'pending' })
    .populate('inviteeId', 'name email photoUrl course year');

  return invites;
};


// =============================================================================
// 3. GET RECEIVED INVITATIONS (for the authenticated user)
// =============================================================================
/**
 * Returns all PENDING invites addressed to the caller.
 * Populates team name and leader name so the frontend can render them directly.
 *
 * @param {string} userId - req.user.id
 * @returns {Promise<Invitation[]>}
 */
const getMyInvitations = async (userId) => {
  const invites = await Invitation.find({ inviteeId: userId, status: 'pending' })
    .populate({
      path:     'teamId',
      select:   'teamName',
      populate: { path: 'leader', select: 'name' },
    });

  return invites;
};


// =============================================================================
// 4. CANCEL INVITATION (leader cancels OR invitee declines before acting)
// =============================================================================
/**
 * Deletes an invitation document.
 * Allowed only if the caller is the original inviter OR the invitee.
 *
 * @param {string} inviteId - URL param :id
 * @param {string} userId   - req.user.id
 * @returns {Promise<{ msg: string }>}
 */
const cancelInvitation = async (inviteId, userId) => {
  const invite = await Invitation.findById(inviteId);
  if (!invite) fail(404, 'Invitation not found');

  // Either the inviter (leader) or the invitee may cancel
  if (
    invite.inviter.toString()   !== userId &&
    invite.inviteeId.toString() !== userId
  ) {
    fail(401, 'Not authorized to cancel this invite.');
  }

  await invite.deleteOne();
  return { msg: 'Invitation removed' };
};


// =============================================================================
// 5. ACCEPT INVITATION (with size + gender check + global cleanup)
// =============================================================================
/**
 * Adds the authenticated user to the team and performs a full cleanup.
 *
 * Rules (via team.rules.js):
 *  - rules.validateTeamSize          — team not full
 *  - rules.validateGenderRequirement — diversity rule not violated
 *
 * On success:
 *  1. Adds user to team.members
 *  2. Removes any lingering join-requests from this user on the team
 *  3. Updates user.team pointer
 *  4. Ghost-buster: deletes EVERY invitation involving this user
 *
 * Runs inside a transaction.
 *
 * @param {string} inviteId - URL param :id
 * @param {string} userId   - req.user.id (must match inviteeId)
 * @returns {Promise<{ msg: string, teamId: string }>}
 */
const acceptInvitation = async (inviteId, userId) => {
  return withTransaction(async (session) => {

    // ── Fetch & authorise ────────────────────────────────────────────────────
    const invitation = await Invitation.findById(inviteId).session(session);
    if (!invitation) fail(404, 'Invitation not found');

    if (invitation.inviteeId.toString() !== userId) {
      fail(401, 'Not authorized');
    }

    // ── Fetch team with member gender data (needed for diversity check) ───────
    const team = await Team.findById(invitation.teamId)
      .populate('members', 'gender')
      .populate('hackathonId')
      .session(session);

    if (!team) {
      // Team was deleted after the invite was sent — clean up the stale invite
      await invitation.deleteOne({ session });
      fail(404, 'Team no longer exists.');
    }

    const hackathonRules = buildRules(team.hackathonId);

    // ── Size check via team.rules ────────────────────────────────────────────
    // Also removes the stale invite if the team is now full
    if (team.members.length >= hackathonRules.maxTeamSize) {
      await invitation.deleteOne({ session });
      fail(400, 'Team is now full.');
    }

    const user = await User.findById(userId).session(session);

    // ── Gender / diversity check via team.rules ───────────────────────────────
    rules.validateGenderRequirement(team, user, hackathonRules);

    // ── 1. Add user to team ──────────────────────────────────────────────────
    team.members.push(userId);
    // Clear any lingering join-requests the user may have sent to this team
    team.pendingRequests = team.pendingRequests.filter(
      (rid) => rid.toString() !== userId
    );
    await team.save({ session });

    // ── 2. Update user profile ────────────────────────────────────────────────
    user.team = team._id;
    await user.save({ session });

    // ── 3. Ghost-buster — wipe EVERY invite involving this user ───────────────
    // Keeps the "Awaiting response" list clean on all dashboards.
    await Invitation.deleteMany(
      {
        $or: [
          { inviteeId: userId }, // Invites they received
          { inviter:   userId }, // Invites they sent (if they were also a leader elsewhere)
        ],
      },
      { session }
    );

    return { msg: 'Joined team successfully and cleared other invites!', teamId: team._id };
  });
};


// =============================================================================
// 6. REJECT INVITATION
// =============================================================================
/**
 * Deletes the invitation document so the slot is freed and the DB stays clean.
 * Only the intended invitee may reject.
 *
 * @param {string} inviteId - URL param :id
 * @param {string} userId   - req.user.id
 * @returns {Promise<{ msg: string }>}
 */
const rejectInvitation = async (inviteId, userId) => {
  const invitation = await Invitation.findById(inviteId);

  if (!invitation) fail(404, 'Invitation not found');

  // Security: only the intended recipient can reject
  if (invitation.inviteeId.toString() !== userId) {
    fail(401, 'Not authorized to reject this invitation.');
  }

  // Delete immediately — frees the reserved slot and keeps DB clean
  await invitation.deleteOne();

  return { msg: 'Invitation rejected and removed.' };
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  sendInvitation,
  getSentInvitations,
  getMyInvitations,
  cancelInvitation,
  acceptInvitation,
  rejectInvitation,
};