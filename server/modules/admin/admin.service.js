/*
===============================================================================
ADMIN SERVICE LAYER
===============================================================================
*/

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isSuperAdmin } = require('../../core/utils/roleHelper');

const User = require('../users/user.model');
const Team = require('../teams/team.model');
const Idea = require('../ideas/idea.model');
const Hackathon = require('../hackathons/hackathon.model');
const AdminLog = require('./adminLog.model');


/* ================= AUTH ================= */
exports.loginAdmin = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error('Please enter all fields');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !user.isAdmin) {
    const err = new Error('Invalid credentials or not an admin');
    err.status = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.status = 400;
    throw err;
  }

  const payload = {
    user: {
      id: user.id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      college: user.college?._id || user.college,
      mustAddPhone: user.mustAddPhone,
      mustChangePassword: user.mustChangePassword
    }
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h'
  });

  return {
    token,
    user: {
      id: user.id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      mustAddPhone: user.mustAddPhone,
      mustChangePassword: user.mustChangePassword
    }
  };
};


/* ================= METRICS ================= */
exports.getMetrics = async (requester = null) => {
  const userFilter = {};
  const teamFilter = {};
  const ideaFilter = {};

  if (requester && !isSuperAdmin(requester) && requester.college) {
    userFilter.college = requester.college;
    teamFilter.college = requester.college;
    ideaFilter.college = requester.college;
  }

  const [
    totalUsers,
    verifiedUsers,
    totalTeams,
    pendingIdeas,
    approvedIdeas,
    rejectedIdeas,
  ] = await Promise.all([
    User.countDocuments(userFilter),
    User.countDocuments({ ...userFilter, isVerified: true }),
    Team.countDocuments(teamFilter),
    Idea.countDocuments({ ...ideaFilter, status: 'pending' }),
    Idea.countDocuments({ ...ideaFilter, status: 'approved' }),
    Idea.countDocuments({ ...ideaFilter, status: 'rejected' }),
  ]);

  const matchStage = teamFilter.college ? { $match: teamFilter } : { $match: {} };
  const pendingJoinAgg = await Team.aggregate([
    matchStage,
    { $project: { count: { $size: { $ifNull: ['$pendingRequests', []] } } } },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);

  const pendingJoinRequests = pendingJoinAgg?.pop()?.total || 0;

  return {
    users: { total: totalUsers, verified: verifiedUsers },
    teams: { total: totalTeams, pendingJoinRequests },
    ideas: {
      pending: pendingIdeas,
      approved: approvedIdeas,
      rejected: rejectedIdeas,
    },
  };
};


/* ================= IDEAS ================= */
exports.listIdeas = async (query, requester = null) => {
  const { page = 1, limit = 20, sort = '-createdAt', status } = query;
  const filters = {};

  if (requester && !isSuperAdmin(requester) && requester.college) {
    filters.college = requester.college;
  }

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filters.status = status;
  }

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Idea.find(filters)
      .populate('author', 'name email')
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    Idea.countDocuments(filters),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage),
    },
  };
};

exports.deleteIdea = async (id, adminId) => {
  const idea = await Idea.findById(id);
  if (!idea) throw new Error('Idea not found');

  await Idea.findByIdAndDelete(id);

  await AdminLog.create({
    actor: adminId,
    action: 'IDEA_DELETE',
    targetType: 'Idea',
    targetId: id,
    meta: { title: idea.title },
  });
};


/* ================= USERS ================= */
exports.listUsers = async (query, requester = null) => {
  const { q = '', verified, admin, role, teamId, collegeId, page = 1, limit = 15, sort = '-createdAt' } = query;
  const filters = {};

  if (requester && !isSuperAdmin(requester) && requester.college) {
    filters.college = requester.college;
  } else if (collegeId && collegeId !== 'all') {
    filters.college = collegeId;
  }

  if (q) {
    filters.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { rollNumber: new RegExp(q, 'i') }
    ];
  }

  if (typeof verified !== 'undefined') filters.isVerified = verified === 'true';
  if (typeof admin !== 'undefined') filters.isAdmin = admin === 'true';
  if (role) filters.role = role;

  if (teamId) {
    const team = await Team.findById(teamId).select('members').lean();
    if (team?.members) filters._id = { $in: team.members };
    else return { items: [], pagination: { total: 0, pages: 1 } };
  }

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(limit) || 15, 1), 100);

  const [users, total] = await Promise.all([
    User.find(filters)
      .select('-password')
      .populate('team', 'teamName')
      .populate('college', 'name shortName')
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    User.countDocuments(filters),
  ]);

  return {
    items: users,
    pagination: {
      page: pageNum,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage),
    },
  };
};

exports.buildTeamFilters = async (query = {}, requester = null) => {
  const { q = '', hackathonId, collegeId, submitted, winner } = query;
  const filters = {};

  if (requester && !isSuperAdmin(requester) && requester.college) {
    filters.college = requester.college;
  } else if (collegeId && collegeId !== 'all') {
    filters.college = collegeId;
  }

  if (q) filters.teamName = new RegExp(q, 'i');
  if (hackathonId && hackathonId !== 'all') filters.hackathonId = hackathonId;
  if (submitted === 'true') filters.isSubmitted = true;
  if (submitted === 'false') filters.isSubmitted = false;
  if (winner === 'true') filters.isWinner = true;

  return filters;
};

exports.updateUser = async (id, body, adminId) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  const { isVerified, isAdmin, role, password, college } = body;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  if (typeof isVerified !== 'undefined') user.isVerified = isVerified;
  if (typeof isAdmin !== 'undefined') user.isAdmin = isAdmin;
  if (role) user.role = role;
  if (college) user.college = college;

  await user.save();

  await AdminLog.create({
    actor: adminId,
    action: 'USER_UPDATE',
    targetType: 'User',
    targetId: user._id,
    meta: { isVerified, isAdmin, role, passwordChanged: !!password },
  });

  return user;
};

exports.deleteUser = async (id, adminId) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  const ledTeam = await Team.findOne({ leader: id });
  if (ledTeam) {
    const err = new Error(`Cannot delete leader of team "${ledTeam.teamName}"`);
    err.status = 400;
    throw err;
  }

  await Team.updateMany({ members: id }, { $pull: { members: id } });
  await User.findByIdAndDelete(id);

  await AdminLog.create({
    actor: adminId,
    action: 'USER_DELETE',
    targetType: 'User',
    targetId: id,
    meta: { name: user.name, email: user.email },
  });
};


/* ================= BULK ================= */
exports.bulkVerify = (ids, value) =>
  User.updateMany({ _id: { $in: ids } }, { $set: { isVerified: !!value } });

exports.bulkDelete = ids =>
  User.deleteMany({ _id: { $in: ids } });

exports.bulkAdmin = (ids, value) =>
  User.updateMany({ _id: { $in: ids } }, { $set: { isAdmin: !!value } });


/* ================= WINNER ================= */
exports.tagWinner = (id, position) =>
  Team.findByIdAndUpdate(id,
    { isWinner: true, winnerPosition: position },
    { new: true }
  );

exports.unmarkWinner = id =>
  Team.findByIdAndUpdate(id,
    { isWinner: false, $unset: { winnerPosition: "" } },
    { new: true }
  );
