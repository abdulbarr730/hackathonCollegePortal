const Team = require('./team.model');
const Hackathon = require('../hackathons/hackathon.model');
const User = require('../users/user.model');
const Invitation = require('./invitation.model');
const rules = require('./team.rules');
const cloudinary = require('../../shared/services/cloudinary.service');
const withTransaction = require('../../shared/utils/withTransaction');


/* ============================================================================
   CREATE TEAM (TX SAFE + LOGO SAFE)
============================================================================ */
exports.createTeam = async ({ userId, body, file }) => {

  let uploadedLogo = null;

  try {

    // 1️⃣ Upload logo FIRST (outside transaction)
    if (file) {
      uploadedLogo = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    }

    // 2️⃣ Start DB transaction
    const result = await withTransaction(async (session) => {

      const { teamName } = body;

      if (!teamName)
        throw Object.assign(new Error('Team name is required.'), { status: 400 });

      const activeHackathon = await Hackathon.findOne({ isActive: true })
        .session(session);

      if (!activeHackathon)
        throw Object.assign(new Error('No active hackathon.'), { status: 400 });

      const existing = await Team.findOne({
        hackathonId: activeHackathon._id,
        members: userId
      }).session(session);

      if (existing)
        throw Object.assign(
          new Error('Already in a team for this event.'),
          { status: 400 }
        );

      const teamData = {
        teamName,
        leader: userId,
        members: [userId],
        hackathonId: activeHackathon._id
      };

      if (uploadedLogo) {
        teamData.logoUrl = uploadedLogo.secure_url;
        teamData.logoPublicId = uploadedLogo.public_id;
      }

      const team = await Team.create([teamData], { session });

      await User.updateOne(
        { _id: userId },
        { $set: { team: team[0]._id } },
        { session }
      );

      return team[0];
    });

    return result;

  } catch (error) {

    // 3️⃣ If DB fails → clean uploaded logo
    if (uploadedLogo?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedLogo.public_id);
      } catch (cleanupError) {
        console.error('Logo cleanup failed:', cleanupError.message);
      }
    }

    throw error;
  }
};

/* ============================================================================
   GET MY TEAM
============================================================================ */
exports.getMyTeam = async ({ userId }) => {

  const user = await User.findById(userId).populate({
    path: 'team',
    populate: [
      { path: 'members', select: 'name email gender photoUrl socialProfiles course year' },
      { path: 'leader', select: 'name email gender photoUrl socialProfiles course year' },
      { path: 'hackathonId' }
    ]
  });

  if (!user)
    throw Object.assign(new Error('User not found.'), { status: 404 });

  return user.team || null;
};

/* ============================================================================
   GET ALL TEAMS (ACTIVE HACKATHON)
============================================================================ */
exports.getAllTeams = async () => {

  const activeHackathon = await Hackathon.findOne({ isActive: true });

  if (!activeHackathon) {
    return []; // No active event → no teams shown
  }

  const teams = await Team.find({
    hackathonId: activeHackathon._id
  })
    .populate('leader', 'name email photoUrl socialProfiles course year')
    .populate('members', 'name email photoUrl socialProfiles course year')
    .populate('pendingRequests', 'name email photoUrl socialProfiles course year');

  return teams;
};

/* ============================================================================
   GET TEAM BY ID
============================================================================ */
exports.getTeamById = async ({ teamId }) => {

  const team = await Team.findById(teamId)
    .populate('leader', 'name email photoUrl socialProfiles course year')
    .populate('members', 'name email photoUrl socialProfiles course year')
    .populate('pendingRequests', 'name email photoUrl socialProfiles course year')
    .populate('hackathonId');

  if (!team)
    throw Object.assign(new Error('Team not found.'), { status: 404 });

  return team;
};

/* ============================================================================
   UPDATE TEAM DETAILS
============================================================================ */
exports.updateTeam = async ({ teamId, userId, body, file }) => {

  const { teamName, problemStatementTitle, problemStatementDescription } = body;

  const team = await Team.findById(teamId);
  if (!team)
    throw Object.assign(new Error('Team not found.'), { status: 404 });

  // Only leader can update
  if (team.leader.toString() !== userId)
    throw Object.assign(new Error('Unauthorized.'), { status: 401 });

  // Lock check
  if (team.isSubmitted)
    throw Object.assign(
      new Error('Team is submitted and locked. Cannot edit.'),
      { status: 400 }
    );

  // Handle logo replacement
  if (file) {
    if (team.logoPublicId) {
      try {
        await cloudinary.uploader.destroy(team.logoPublicId);
      } catch (err) {
        console.error('Cloudinary delete failed:', err.message);
      }
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    team.logoUrl = uploadResult.secure_url;
    team.logoPublicId = uploadResult.public_id;
  }

  // Update fields
  if (teamName !== undefined) team.teamName = teamName;
  if (problemStatementTitle !== undefined)
    team.problemStatementTitle = problemStatementTitle;
  if (problemStatementDescription !== undefined)
    team.problemStatementDescription = problemStatementDescription;

  await team.save();

  return team;
};

/* ============================================================================
   REMOVE TEAM LOGO
============================================================================ */
exports.removeLogo = async ({ teamId, userId }) => {

  const team = await Team.findById(teamId);
  if (!team)
    throw Object.assign(new Error('Team not found.'), { status: 404 });

  // Only leader can remove logo
  if (team.leader.toString() !== userId)
    throw Object.assign(new Error('Unauthorized.'), { status: 401 });

  // Lock check
  if (team.isSubmitted)
    throw Object.assign(
      new Error('Team is locked. Cannot modify logo.'),
      { status: 400 }
    );

  if (team.logoPublicId) {
    try {
      await cloudinary.uploader.destroy(team.logoPublicId);
    } catch (err) {
      console.error('Cloudinary delete failed:', err.message);
    }
  }

  team.logoUrl = '';
  team.logoPublicId = '';
  await team.save();

  return { msg: 'Logo removed successfully.', team };
};

/* ============================================================================
   SEND JOIN REQUEST
============================================================================ */
exports.sendJoinRequest = async ({ teamId, userId }) => {

  const team = await Team.findById(teamId)
    .populate('members')
    .populate('hackathonId');

  if (!team)
    throw Object.assign(new Error('Team not found.'), { status: 404 });

  if (team.isSubmitted)
    throw Object.assign(
      new Error('This team is locked and not accepting new members.'),
      { status: 400 }
    );

  const maxMembers = team.hackathonId?.maxTeamSize || 6;

  if (team.members.length >= maxMembers)
    throw Object.assign(
      new Error(`Team is full (Max ${maxMembers}).`),
      { status: 400 }
    );

  const user = await User.findById(userId);

  if (!user)
    throw Object.assign(new Error('User not found.'), { status: 404 });

  if (user.team)
    throw Object.assign(
      new Error('You are already in a team.'),
      { status: 400 }
    );

  if (team.pendingRequests.map(id => id.toString()).includes(userId))
    throw Object.assign(
      new Error('You already sent a request to this team.'),
      { status: 400 }
    );

  team.pendingRequests.push(userId);
  await team.save();

  return { msg: 'Join request sent successfully.' };
};

/* ============================================================================
   CANCEL JOIN REQUEST
============================================================================ */
exports.cancelJoinRequest = async ({ teamId, userId }) => {

  const team = await Team.findById(teamId);
  if (!team)
    throw Object.assign(new Error('Team not found.'), { status: 404 });

  const wasRequested = team.pendingRequests
    .map(id => id.toString())
    .includes(userId);

  if (!wasRequested)
    throw Object.assign(
      new Error('No pending request found for this team.'),
      { status: 400 }
    );

  await Team.updateOne(
    { _id: teamId },
    { $pull: { pendingRequests: userId } }
  );

  return { msg: 'Join request cancelled.' };
};


/* ============================================================================
   APPROVE JOIN REQUEST (TX HELPER)
============================================================================ */
exports.approveJoin = async ({ teamId, leaderId, userId }) => {

  return withTransaction(async (session) => {

    const team = await Team.findById(teamId)
      .populate('members', 'gender')
      .populate('hackathonId')
      .session(session);

    if (!team)
      throw Object.assign(new Error('Team not found.'), { status: 404 });

    if (team.leader.toString() !== leaderId)
      throw Object.assign(new Error('Unauthorized.'), { status: 401 });

    const maxMembers = team.hackathonId?.maxTeamSize || 6;

    rules.ensureNotSubmitted(team);
    rules.validateTeamSize(team, maxMembers);

    const user = await User.findById(userId).session(session);

    if (!user || user.team)
      throw Object.assign(new Error('User unavailable.'), { status: 400 });

    rules.validateGenderRequirement(team, user, {
      minFemaleMembers: team.hackathonId?.minFemaleMembers,
      maxTeamSize: maxMembers
    });

    team.members.push(userId);
    team.pendingRequests = team.pendingRequests.filter(
      id => id.toString() !== userId
    );

    await team.save({ session });

    user.team = teamId;
    await user.save({ session });

    await Invitation.deleteMany(
      { inviteeId: userId, teamId },
      { session }
    );

    return team;
  });
};

/* ============================================================================
   REJECT JOIN REQUEST (LEADER ACTION)
============================================================================ */
exports.rejectJoinRequest = async ({ teamId, leaderId, userId }) => {

  const team = await Team.findById(teamId);
  if (!team)
    throw Object.assign(new Error('Team not found.'), { status: 404 });

  // Only leader can reject
  if (team.leader.toString() !== leaderId)
    throw Object.assign(new Error('Unauthorized.'), { status: 401 });

  const exists = team.pendingRequests
    .map(id => id.toString())
    .includes(userId);

  if (!exists)
    throw Object.assign(
      new Error('No pending request from this user.'),
      { status: 400 }
    );

  await Team.updateOne(
    { _id: teamId },
    { $pull: { pendingRequests: userId } }
  );

  return { msg: 'Join request rejected.' };
};

/* ============================================================================
   FINAL SUBMIT (LOCK TEAM)
============================================================================ */
exports.submitTeam = async ({ teamId, userId }) => {

  const team = await Team.findById(teamId)
    .populate('members', 'gender')
    .populate('hackathonId');

  if (!team)
    throw Object.assign(new Error('Team not found'), { status: 404 });

  if (team.leader.toString() !== userId)
    throw Object.assign(new Error('Only leader can submit'), { status: 401 });

  rules.ensureNotSubmitted(team);

  const hackathon = team.hackathonId;

  const minMembers = hackathon?.minTeamSize || 1;
  const maxMembers = hackathon?.maxTeamSize || 6;
  const minFemales = hackathon?.minFemaleMembers || 0;
  const deadline = hackathon?.submissionDeadline;

  /* -------- Deadline Check -------- */
  rules.validateDeadline(deadline);

  /* -------- Team Size Check -------- */
  if (team.members.length < minMembers || team.members.length > maxMembers) {
    throw Object.assign(
      new Error(`Team size must be between ${minMembers} and ${maxMembers}.`),
      { status: 400 }
    );
  }

  /* -------- Gender Rule Check -------- */
  const femaleCount = team.members.filter(m =>
    m.gender && ['female', 'f'].includes(m.gender.toLowerCase())
  ).length;

  if (femaleCount < minFemales) {
    throw Object.assign(
      new Error(`Need at least ${minFemales} female member(s).`),
      { status: 400 }
    );
  }

  /* -------- Lock Team -------- */
  team.isSubmitted = true;
  team.pendingRequests = [];

  await team.save();

  return {
    msg: 'Team submitted successfully!',
    team
  };
};

/* ============================================================================
   LEAVE TEAM (TX SAFE)
============================================================================ */
exports.leaveTeam = async ({ userId }) => {

  return withTransaction(async (session) => {

    const user = await User.findById(userId).session(session);

    if (!user || !user.team)
      throw Object.assign(
        new Error('You are not in a team.'),
        { status: 400 }
      );

    const team = await Team.findById(user.team).session(session);

    if (!team)
      throw Object.assign(new Error('Team not found.'), { status: 404 });

    if (team.leader.toString() === userId)
      throw Object.assign(
        new Error('Leader cannot leave. Delete team instead.'),
        { status: 400 }
      );

    if (team.isSubmitted)
      throw Object.assign(
        new Error('Team is locked.'),
        { status: 400 }
      );

    await Team.updateOne(
      { _id: team._id },
      { $pull: { members: userId } },
      { session }
    );

    await User.updateOne(
      { _id: userId },
      { $unset: { team: "" } },
      { session }
    );

    return { msg: 'You have left the team.' };
  });
};

/* ============================================================================
   REMOVE MEMBER (TX SAFE)
============================================================================ */
exports.removeMember = async ({ teamId, leaderId, memberId }) => {

  return withTransaction(async (session) => {

    const team = await Team.findById(teamId).session(session);

    if (!team)
      throw Object.assign(new Error('Team not found.'), { status: 404 });

    if (team.leader.toString() !== leaderId)
      throw Object.assign(new Error('Unauthorized.'), { status: 401 });

    if (team.isSubmitted)
      throw Object.assign(
        new Error('Team is locked.'),
        { status: 400 }
      );

    if (memberId === leaderId)
      throw Object.assign(
        new Error('Leader cannot remove themselves.'),
        { status: 400 }
      );

    await Team.updateOne(
      { _id: teamId },
      { $pull: { members: memberId } },
      { session }
    );

    await User.updateOne(
      { _id: memberId },
      { $unset: { team: "" } },
      { session }
    );

    return { msg: 'Member removed successfully.' };
  });
};

/* ============================================================================
   DELETE TEAM (TX SAFE)
============================================================================ */
exports.deleteTeam = async ({ teamId, userId }) => {

  let logoPublicId = null;

  const result = await withTransaction(async (session) => {

    const team = await Team.findById(teamId).session(session);

    if (!team)
      throw Object.assign(new Error('Team not found.'), { status: 404 });

    if (team.leader.toString() !== userId)
      throw Object.assign(new Error('Unauthorized.'), { status: 401 });

    if (team.isSubmitted)
      throw Object.assign(
        new Error('Team is locked. Cannot delete.'),
        { status: 400 }
      );

    logoPublicId = team.logoPublicId;

    await User.updateMany(
      { _id: { $in: team.members } },
      { $unset: { team: "" } },
      { session }
    );

    await Invitation.deleteMany(
      { teamId: team._id },
      { session }
    );

    await team.deleteOne({ session });

    return { msg: 'Team deleted successfully.' };
  });

  // External side-effect AFTER commit
  if (logoPublicId) {
    try {
      await cloudinary.uploader.destroy(logoPublicId);
    } catch (err) {
      console.error('Cloudinary cleanup failed:', err.message);
    }
  }

  return result;
};