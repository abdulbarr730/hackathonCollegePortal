const Hackathon = require('./hackathon.model');
const Team = require('../teams/team.model');
const { isSuperAdmin } = require('../../core/utils/roleHelper');

/* ============================================================================
   GET ACTIVE HACKATHON
============================================================================ */
exports.getActiveHackathon = async (collegeId = null) => {
  let active = null;
  if (collegeId && collegeId !== 'all') {
    active = await Hackathon.findOne({ isActive: true, college: collegeId }).populate('college', 'name shortName');
  }
  if (!active) {
    active = await Hackathon.findOne({ isActive: true }).populate('college', 'name shortName');
  }

  if (!active) {
    return {
      name: "Smart India Hackathon 2026",
      shortName: "SIH '26",
      minTeamSize: 6,
      maxTeamSize: 6,
      minFemaleMembers: 1
    };
  }

  return active;
};

/* ============================================================================
   LIST HACKATHONS (Scoped strictly by College for non-super admins)
============================================================================ */
exports.listHackathons = async (query = {}, requester = null) => {
  const { status, collegeId } = query;
  let filter = {};

  // Archive logic
  if (status === 'inactive') {
    filter.isActive = false;
  }

  // Multi-Tenancy Scope: SPOC / College Admin only sees their college hackathons
  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = requester.college._id || requester.college;
    filter.college = userCollegeId;
  } else if (collegeId && collegeId !== 'all') {
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
exports.createHackathon = async (body, requester = null) => {
  const { name, startDate, college, minTeamSize, maxTeamSize, minFemaleMembers, ...rest } = body;

  let assignedCollege = null;
  if (requester && !isSuperAdmin(requester) && requester.college) {
    assignedCollege = requester.college._id || requester.college;
  } else if (college && college !== 'all') {
    assignedCollege = college;
  }

  // Ensure only one active hackathon per college scope
  if (body.isActive) {
    const scope = assignedCollege ? { college: assignedCollege } : { college: null };
    await Hackathon.updateMany(scope, { isActive: false });
  }

  const newHackathon = new Hackathon({
    name,
    college: assignedCollege,
    startDate: startDate || new Date(),
    minTeamSize: minTeamSize !== undefined ? Number(minTeamSize) : 6,
    maxTeamSize: maxTeamSize !== undefined ? Number(maxTeamSize) : 6,
    minFemaleMembers: minFemaleMembers !== undefined ? Number(minFemaleMembers) : 1,
    ...rest
  });

  await newHackathon.save();
  return newHackathon;
};

/* ============================================================================
   SET ACTIVE HACKATHON
============================================================================ */
exports.setActiveHackathon = async (id, requester = null) => {
  const current = await Hackathon.findById(id);
  if (!current) {
    const err = new Error('Hackathon not found');
    err.status = 404;
    throw err;
  }

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (current.college && String(current.college) !== userCollegeId) {
      const err = new Error('You do not have permission to activate hackathons of another college.');
      err.status = 403;
      throw err;
    }
  }

  const scope = current.college ? { college: current.college } : { college: { $in: [null, undefined] } };
  await Hackathon.updateMany(scope, { isActive: false });

  const updated = await Hackathon.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  ).populate('college', 'name shortName');

  return updated;
};

/* ============================================================================
   UPDATE HACKATHON DETAILS
============================================================================ */
exports.updateHackathon = async (id, body, requester = null) => {
  const existing = await Hackathon.findById(id);
  if (!existing) {
    const err = new Error('Hackathon not found');
    err.status = 404;
    throw err;
  }

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to edit hackathons of another college.');
      err.status = 403;
      throw err;
    }
  }

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

  let assignedCollege = existing.college;
  if (isSuperAdmin(requester)) {
    assignedCollege = college && college !== 'all' ? college : null;
  }

  const updated = await Hackathon.findByIdAndUpdate(
    id,
    {
      name,
      shortName,
      tagline,
      college: assignedCollege,
      startDate,
      submissionDeadline,
      minTeamSize: minTeamSize !== undefined ? Number(minTeamSize) : 6,
      maxTeamSize: maxTeamSize !== undefined ? Number(maxTeamSize) : 6,
      minFemaleMembers: minFemaleMembers !== undefined ? Number(minFemaleMembers) : 1
    },
    { new: true }
  ).populate('college', 'name shortName');

  return updated;
};

/* ============================================================================
   DELETE HACKATHON
============================================================================ */
exports.deleteHackathon = async (id, requester = null) => {
  const existing = await Hackathon.findById(id);
  if (!existing) {
    const err = new Error('Hackathon not found');
    err.status = 404;
    throw err;
  }

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to delete hackathons of another college.');
      err.status = 403;
      throw err;
    }
  }

  await Hackathon.findByIdAndDelete(id);
  return true;
};

/* ============================================================================
   MIGRATE LEGACY TEAMS
============================================================================ */
exports.migrateLegacyTeams = async () => {
  const active = await Hackathon.findOne({ isActive: true });
  if (!active) throw new Error('No active hackathon found to attach teams to');
  const res = await Team.updateMany(
    { hackathonId: { $exists: false } },
    { $set: { hackathonId: active._id } }
  );
  return res;
};

/* ============================================================================
   BULK LOCK TEAMS
============================================================================ */
exports.lockAllTeams = async (hackathonId) => {
  const res = await Team.updateMany(
    { hackathonId: hackathonId },
    { $set: { isSubmitted: true } }
  );
  return res;
};
