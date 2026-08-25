const Hackathon = require('./hackathon.model');
const Team = require('../teams/team.model');
/* ============================================================================
   GET ACTIVE HACKATHON
============================================================================ */
exports.getActiveHackathon = async () => {

  const active = await Hackathon.findOne({ isActive: true });

  if (!active) {
    return {
      title: "Hackathon",
      minTeamSize: 6,
      maxTeamSize: 6,
      minFemaleMembers: 0
    };
  }

  return active;
};

/* ============================================================================
   LIST HACKATHONS (WITH ARCHIVE FILTER)
============================================================================ */
exports.listHackathons = async (query) => {

  const { status, collegeId } = query;
  let filter = {};

  // Archive logic
  if (status === 'inactive') {
    filter.isActive = false;
  }

  if (collegeId && collegeId !== 'all') {
    filter.college = collegeId;
  }

  const hackathons = await Hackathon
    .find(filter)
    .populate('college', 'name shortName')
    .sort({ startDate: -1 });

  return hackathons;
};

/* ============================================================================
   CREATE HACKATHON
============================================================================ */
exports.createHackathon = async (body) => {

  const { name, startDate, college, ...rest } = body;

  // Ensure only one active hackathon
  if (body.isActive) {
    await Hackathon.updateMany({}, { isActive: false });
  }

  const newHackathon = new Hackathon({
    name,
    college: college || null,
    startDate: startDate || new Date(),
    ...rest
  });

  await newHackathon.save();

  return newHackathon;
};

/* ============================================================================
   SET ACTIVE HACKATHON
============================================================================ */
exports.setActiveHackathon = async (id) => {

  // First deactivate all
  const current = await Hackathon.findById(id);
  if (!current) {
    const err = new Error('Hackathon not found');
    err.status = 404;
    throw err;
  }

  const scope = current.college ? { college: current.college } : { college: { $in: [null, undefined] } };
  await Hackathon.updateMany(scope, { isActive: false });

  // Then activate selected one
  const updated = await Hackathon.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  if (!updated) {
    const err = new Error('Hackathon not found');
    err.status = 404;
    throw err;
  }

  return updated;
};


/* ============================================================================
   UPDATE HACKATHATHON DETAILS
============================================================================ */
exports.updateHackathon = async (id, body) => {

  const {
    name,
    shortName,
    tagline,
    college,
    startDate,
    submissionDeadline,
    minTeamSize,
    maxTeamSize,
    minFemaleMembers
  } = body;

  const updated = await Hackathon.findByIdAndUpdate(
    id,
    {
      name,
      shortName,
      tagline,
      college: college || null,
      startDate,
      submissionDeadline,
      minTeamSize,
      maxTeamSize,
      minFemaleMembers
    },
    { new: true }
  );

  if (!updated) {
    const err = new Error('Hackathon not found');
    err.status = 404;
    throw err;
  }

  return updated;
};

/* ============================================================================
   MIGRATE LEGACY TEAMS (ADD hackathonId TO OLD TEAMS)
============================================================================ */
exports.migrateLegacyTeams = async (targetHackathonId) => {
  if (!targetHackathonId) {
    const err = new Error('Target Hackathon ID required');
    err.status = 400;
    throw err;
  }

  const result = await Team.updateMany(
    { hackathonId: { $exists: false } },
    { $set: { hackathonId: targetHackathonId } }
  );

  return result.modifiedCount;
};

/* ============================================================================
   BULK LOCK TEAMS FOR A HACKATHON
============================================================================ */
exports.lockAllTeams = async (hackathonId) => {
  if (!hackathonId) {
    const err = new Error('Hackathon ID is required.');
    err.status = 400;
    throw err;
  }

  const result = await Team.updateMany(
    { hackathonId: hackathonId },
    { $set: { isSubmitted: true, pendingRequests: [] } }
  );

  return result.modifiedCount;
};

/* ============================================================================
   DELETE HACKATHON
============================================================================ */
exports.deleteHackathon = async (id, requester) => {
  const hackathon = await Hackathon.findById(id);
  if (!hackathon) {
    const err = new Error('Hackathon not found');
    err.status = 404;
    throw err;
  }

  // If college admin, ensure it belongs to their college
  if (requester?.role === 'college_admin' && hackathon.college && String(hackathon.college) !== String(requester.college)) {
    const err = new Error('Unauthorized to delete hackathon from another institution');
    err.status = 403;
    throw err;
  }

  await Hackathon.findByIdAndDelete(id);
  return { msg: 'Hackathon deleted successfully' };
};
