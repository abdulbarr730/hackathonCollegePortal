const Invitation = require('./invitation.model');
const Team = require('./team.model');
const User = require('../users/user.model');
const Hackathon = require('../hackathons/hackathon.model');
const rules = require('./team.rules');
const withTransaction = require('../../shared/utils/withTransaction');



/* ============================================================================
   SEND INVITATION
============================================================================ */
exports.sendInvitation = async ({ teamId, inviterId, inviteeId }) => {

  const team = await Team.findById(teamId).populate('hackathonId');
  if (!team)
    throw Object.assign(new Error('Team not found.'), { status: 404 });

  // Only leader can invite
  if (team.leader.toString() !== inviterId)
    throw Object.assign(
      new Error('Only the team leader can send invites.'),
      { status: 401 }
    );

  if (team.isSubmitted)
    throw Object.assign(
      new Error('Team is locked. Cannot invite new members.'),
      { status: 400 }
    );

  const maxMembers = team.hackathonId?.maxTeamSize || 6;

  const pendingInvites = await Invitation.countDocuments({
    teamId: team._id,
    status: 'pending'
  });

  if (team.members.length + pendingInvites >= maxMembers)
    throw Object.assign(
      new Error('Team limit reached.'),
      { status: 400 }
    );

  const invitee = await User.findById(inviteeId).populate('team');
  if (!invitee)
    throw Object.assign(new Error('User not found.'), { status: 404 });

  // Active hackathon membership check
  const activeHackathon = await Hackathon.findOne({ isActive: true });

  if (activeHackathon && invitee.team) {
    const inviteeTeam = await Team.findById(invitee.team._id || invitee.team);

    if (
      inviteeTeam &&
      inviteeTeam.hackathonId.toString() === activeHackathon._id.toString()
    ) {
      throw Object.assign(
        new Error('User already in a team for this active event.'),
        { status: 400 }
      );
    }
  }

  const existingInvite = await Invitation.findOne({
    teamId,
    inviteeId,
    status: 'pending'
  });

  if (existingInvite)
    throw Object.assign(
      new Error('Invitation already sent to this user.'),
      { status: 400 }
    );

  const invitation = await Invitation.create({
    inviter: inviterId,
    inviteeId,
    teamId,
    status: 'pending'
  });

  return invitation;
};


/* ============================================================================
   ACCEPT INVITATION (WITH TRANSACTION)
============================================================================ */
exports.acceptInvitation = async ({ invitationId, userId }) => {

  return withTransaction(async (session) => {

    const invitation = await Invitation.findById(invitationId).session(session);
    if (!invitation)
      throw Object.assign(new Error('Invitation not found.'), { status: 404 });

    if (invitation.inviteeId.toString() !== userId)
      throw Object.assign(new Error('Unauthorized.'), { status: 401 });

    const team = await Team.findById(invitation.teamId)
      .populate('members', 'gender')
      .populate('hackathonId')
      .session(session);

    if (!team)
      throw Object.assign(new Error('Team not found.'), { status: 404 });

    rules.ensureNotSubmitted(team);

    const maxMembers = team.hackathonId?.maxTeamSize || 6;
    rules.validateTeamSize(team, maxMembers);

    const user = await User.findById(userId).session(session);

    rules.validateGenderRequirement(team, user, {
      minFemaleMembers: team.hackathonId?.minFemaleMembers,
      maxTeamSize: maxMembers
    });

    team.members.push(userId);
    team.pendingRequests = team.pendingRequests.filter(
      id => id.toString() !== userId
    );

    await team.save({ session });

    user.team = team._id;
    await user.save({ session });

    await Invitation.deleteMany(
      {
        $or: [
          { inviteeId: userId },
          { inviter: userId }
        ]
      },
      { session }
    );

    return {
      msg: 'Joined team successfully.',
      teamId: team._id
    };
  });
};

/* ============================================================================
   CANCEL INVITATION
============================================================================ */
exports.cancelInvitation = async ({ invitationId, userId }) => {

  const invite = await Invitation.findById(invitationId);

  if (!invite)
    throw Object.assign(new Error('Invitation not found.'), { status: 404 });

  if (
    invite.inviter.toString() !== userId &&
    invite.inviteeId.toString() !== userId
  ) {
    throw Object.assign(
      new Error('Not authorized to cancel this invitation.'),
      { status: 401 }
    );
  }

  await invite.deleteOne();

  return { msg: 'Invitation removed.' };
};

/* ============================================================================
   REJECT INVITATION
============================================================================ */
exports.rejectInvitation = async ({ invitationId, userId }) => {

  const invitation = await Invitation.findById(invitationId);

  if (!invitation)
    throw Object.assign(new Error('Invitation not found.'), { status: 404 });

  if (invitation.inviteeId.toString() !== userId)
    throw Object.assign(new Error('Unauthorized.'), { status: 401 });

  await invitation.deleteOne();

  return { msg: 'Invitation rejected.' };
};

/* ============================================================================
   GET SENT INVITATIONS (LEADER)
============================================================================ */
exports.getSentInvitations = async ({ userId }) => {

  const team = await Team.findOne({ leader: userId }).sort({ createdAt: -1 });

  if (!team) return [];

  const invites = await Invitation.find({
    teamId: team._id,
    status: 'pending'
  }).populate('inviteeId', 'name email photoUrl course year');

  return invites;
};

/* ============================================================================
   GET RECEIVED INVITATIONS
============================================================================ */
exports.getMyInvitations = async ({ userId }) => {

  const invites = await Invitation.find({
    inviteeId: userId,
    status: 'pending'
  }).populate({
    path: 'teamId',
    select: 'teamName',
    populate: { path: 'leader', select: 'name' }
  });

  return invites;
};