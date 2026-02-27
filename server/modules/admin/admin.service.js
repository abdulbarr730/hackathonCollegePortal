/*
===============================================================================
ADMIN SERVICE LAYER (BUSINESS LOGIC CORE)
===============================================================================

Purpose:
Contains all business logic for admin functionality.
This is the brain of the admin module.

Responsibilities:
- Database queries
- Aggregations
- Validation rules
- Security decisions
- Multi-step operations
- Domain workflows
- Logging triggers
- Data transformations

Services should be reusable.
Controllers call services, but services should NOT depend on controllers.

What should NOT be here:
✗ Express req/res objects
✗ HTTP status codes
✗ Cookies or headers
✗ Route-specific logic

Architecture flow:
Controller → Service → Models/DB

If future features need:
- background jobs
- analytics
- scheduled tasks
- exports
- notifications

They should call service functions from here.

This file answers:
“How does the system actually work?”

Controllers answer:
“How do we expose it over HTTP?”

Rule of thumb:
If logic touches database or domain rules,
it belongs here, not in controller.

===============================================================================
*/

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../users/user.model');
const Team = require('../teams/team.model');
const Idea = require('../ideas/idea.model');
const AdminLog = require('./adminLog.model');
const Hackathon = require('../hackathons/hackathon.model');

/* ================= AUTH ================= */
exports.loginAdmin = async ({ email, password }) => {
  const user = await User.findOne({ email });

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

  const payload = { user: { id: user.id, isAdmin: user.isAdmin } };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h'
  });

  return { token };
};


/* ================= METRICS ================= */
exports.getMetrics = async () => {
  const [
    totalUsers,
    verifiedUsers,
    totalTeams,
    pendingIdeas,
    approvedIdeas,
    rejectedIdeas,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    Team.countDocuments(),
    Idea.countDocuments({ status: 'pending' }),
    Idea.countDocuments({ status: 'approved' }),
    Idea.countDocuments({ status: 'rejected' }),
  ]);

  const pendingJoinAgg = await Team.aggregate([
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
exports.listIdeas = async (query) => {
  const { page = 1, limit = 20, sort = '-createdAt', status } = query;
  const filters = {};

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
exports.listUsers = async (query) => {
  const { q = '', verified, admin, role, teamId, page = 1, limit = 15, sort = '-createdAt' } = query;
  const filters = {};

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

exports.updateUser = async (id, body, adminId) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  const { isVerified, isAdmin, role, password } = body;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  if (typeof isVerified !== 'undefined') user.isVerified = isVerified;
  if (typeof isAdmin !== 'undefined') user.isAdmin = isAdmin;
  if (role) user.role = role;

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