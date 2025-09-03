const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const json2csv = require('json2csv').parse;

// MODELS
const User = require('../models/User');
const Team = require('../models/Team');
const Idea = require('../models/Idea');
const AdminLog = require('../models/AdminLog');

// MIDDLEWARE
const adminAuth = require('../middleware/adminAuth');

/* ========================================================================
   ADMIN LOGIN
   ======================================================================== */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.isAdmin) {
      return res.status(400).json({ msg: 'Invalid credentials or not an admin' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id, isAdmin: user.isAdmin } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60 * 1000,
      })
      .json({ msg: 'Admin login successful' });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).send('Server Error');
  }
});

/* ========================================================================
   DASHBOARD METRICS
   ======================================================================== */
router.get('/metrics', adminAuth, async (_req, res) => {
  try {
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

    res.json({
      users: { total: totalUsers, verified: verifiedUsers },
      teams: { total: totalTeams, pendingJoinRequests },
      ideas: { pending: pendingIdeas, approved: approvedIdeas, rejected: rejectedIdeas },
    });
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).send('Server Error');
  }
});

/* ========================================================================
   IDEAS MANAGEMENT
   ======================================================================== */
router.get('/ideas', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt', status } = req.query;
    const filters = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filters.status = status;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Idea.find(filters)
        .populate('author', 'name email')
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      Idea.countDocuments(filters),
    ]);

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    console.error('Admin list ideas error:', err);
    res.status(500).send('Server Error');
  }
});

router.delete('/ideas/:id', adminAuth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ msg: 'Idea not found' });
    }

    await Idea.findByIdAndDelete(req.params.id);

    await AdminLog.create({
      actor: req.user.id,
      action: 'IDEA_DELETE',
      targetType: 'Idea',
      targetId: req.params.id,
      meta: { title: idea.title },
    });

    res.json({ msg: 'Idea deleted successfully' });
  } catch (err) {
    console.error('Admin delete idea error:', err);
    res.status(500).send('Server Error');
  }
});

/* ========================================================================
   USERS MANAGEMENT
   ======================================================================== */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { q = '', verified, admin, role, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // ------------------------------
    // 1. Build Filters
    // ------------------------------
    const filters = {};
    if (q) filters.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (typeof verified !== 'undefined') filters.isVerified = verified === 'true';
    if (typeof admin !== 'undefined') filters.isAdmin = admin === 'true';
    if (role) filters.role = role;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // ------------------------------
    // 2. Fetch Users (Paginated)
    // ------------------------------
    const [users, total] = await Promise.all([
      User.find(filters)
        .select('-password')
        .populate('team', 'teamName') // ✅ Populate direct team reference if exists
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      User.countDocuments(filters),
    ]);

    // ------------------------------
    // 3. Fetch Teams for Fallback
    // ------------------------------
    const teams = await Team.find().select('teamName members').lean();

    // Create a map of userId -> teamName
    const userToTeamMap = {};
    teams.forEach(team => {
      team.members.forEach(memberId => {
        userToTeamMap[memberId.toString()] = team.teamName;
      });
    });

    // ------------------------------
    // 4. Final mapping: Attach Team
    // ------------------------------
    const usersWithTeam = users.map(user => ({
      ...user,
      teamName:
        user.team?.teamName || // Direct reference
        userToTeamMap[user._id.toString()] || // Fallback through members array
        'N/A', // Default if no team
    }));

    // ------------------------------
    // 5. Send Response
    // ------------------------------
    res.json({
      items: usersWithTeam,
      pagination: {
        page: pageNum,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).send('Server Error');
  }
});



// Export users
router.get('/export/users', adminAuth, async (req, res) => {
  try {
    const { q = '', verified, role, excludeAdmin = 'true' } = req.query;
    const filters = {};
    if (q) filters.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (typeof verified !== 'undefined') filters.isVerified = verified === 'true';
    if (role) filters.role = role;
    if (excludeAdmin === 'true') filters.isAdmin = { $ne: true };

    const users = await User.find(filters).select('-password').lean();
    const teams = await Team.find().select('name members').lean();

    // Map userId -> teamName
    const userToTeamMap = {};
    teams.forEach(team => {
      team.members.forEach(memberId => {
        userToTeamMap[memberId.toString()] = team.name;
      });
    });

    const data = users.map(u => ({
      Name: u.name,
      Email: u.email,
      RollNumber: u.rollNumber || '',
      Role: u.role,
      Verified: u.isVerified,
      Team: userToTeamMap[u._id.toString()] || '',
    }));

    const csv = json2csv(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    return res.send(csv);
  } catch (err) {
    console.error('Export users error:', err);
    res.status(500).send('Server Error');
  }
});

// GET user by ID
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('team');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).send('Server Error');
  }
});

// PUT user updates
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { isVerified, isAdmin, role, password } = req.body;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ msg: 'User not found' });

    const allowedRoles = ['student', 'spoc', 'judge', 'admin'];
    const changes = {};
    const logs = [];

    if (typeof isVerified !== 'undefined') {
      const from = target.isVerified;
      target.isVerified = !!isVerified;
      changes.isVerified = { from, to: target.isVerified };
      logs.push({ action: 'USER_VERIFY', meta: { from, to: target.isVerified } });
    }

    if (typeof isAdmin !== 'undefined') {
      const from = target.isAdmin;
      target.isAdmin = !!isAdmin;
      changes.isAdmin = { from, to: target.isAdmin };
      logs.push({ action: 'USER_ADMIN_TOGGLE', meta: { from, to: target.isAdmin } });
    }

    if (typeof role !== 'undefined') {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ msg: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
      }
      const from = target.role;
      target.role = role;
      changes.role = { from, to: role };
      logs.push({ action: 'USER_ROLE_UPDATE', meta: { from, to: role } });
    }

    if (typeof password !== 'undefined') {
      if (!password || password.length < 8) {
        return res.status(400).json({ msg: 'Password must be at least 8 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      target.password = await bcrypt.hash(password, salt);
      changes.password = { changed: true };
      logs.push({ action: 'USER_PASSWORD_RESET', meta: {} });
    }

    if (Object.keys(changes).length === 0) return res.status(400).json({ msg: 'No valid update fields provided' });

    await target.save();

    for (const l of logs) {
      await AdminLog.create({
        actor: req.user.id,
        action: l.action,
        targetType: 'User',
        targetId: target._id,
        meta: l.meta || {},
      });
    }

    res.json({
      msg: 'User updated successfully',
      user: {
        _id: target._id,
        email: target.email,
        isAdmin: target.isAdmin,
        isVerified: target.isVerified,
        role: target.role,
      },
    });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).send('Server Error');
  }
});

/* ========================================================================
   BULK USER ACTIONS
   ======================================================================== */
router.post('/users/bulk-verify', adminAuth, async (req, res) => {
  try {
    const { ids = [], isVerified = true } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ msg: 'ids array required' });

    const result = await User.updateMany({ _id: { $in: ids } }, { $set: { isVerified: !!isVerified } });

    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_BULK_VERIFY',
      targetType: 'User',
      targetId: req.user.id,
      meta: { ids, isVerified: !!isVerified, matched: result.matchedCount, modified: result.modifiedCount },
    });

    res.json({ msg: 'Bulk verify completed', matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    console.error('Admin bulk verify error:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/users/bulk-delete', adminAuth, async (req, res) => {
  try {
    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ msg: 'ids array required' });

    const result = await User.deleteMany({ _id: { $in: ids } });

    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_BULK_DELETE',
      targetType: 'User',
      targetId: req.user.id,
      meta: { ids, deleted: result.deletedCount },
    });

    res.json({ msg: 'Bulk delete completed', deleted: result.deletedCount });
  } catch (err) {
    console.error('Admin bulk delete error:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/users/bulk-admin', adminAuth, async (req, res) => {
  try {
    const { ids = [], isAdmin = true } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ msg: 'ids array required' });

    const result = await User.updateMany({ _id: { $in: ids } }, { $set: { isAdmin: !!isAdmin } });

    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_BULK_ADMIN',
      targetType: 'User',
      targetId: req.user.id,
      meta: { ids, isAdmin: !!isAdmin, matched: result.matchedCount, modified: result.modifiedCount },
    });

    res.json({ msg: 'Bulk admin update completed', matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    console.error('Admin bulk admin error:', err);
    res.status(500).send('Server Error');
  }
});

/* ========================================================================
   TEAMS MANAGEMENT
   ======================================================================== */
router.get('/teams', adminAuth, async (req, res) => {
  try {
    const { leader, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filters = {};
    if (leader) filters.leader = leader;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const query = Team.find(filters)
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate('leader', 'name email photoUrl')
      .populate('members', 'name email photoUrl')
      .lean();

    const [items, total] = await Promise.all([query.exec(), Team.countDocuments(filters)]);

    const mapped = items.map((t) => ({
      ...t,
      memberCount: Array.isArray(t.members) ? t.members.length : 0,
      pendingCount: Array.isArray(t.pendingRequests) ? t.pendingRequests.length : 0,
    }));

    res.json({
      items: mapped,
      pagination: {
        page: pageNum,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    console.error('Admin list teams error:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/teams/:id', adminAuth, async (req, res) => {
  try {
    const t = await Team.findById(req.params.id)
      .populate('leader', 'name email photoUrl')
      .populate('members', 'name email photoUrl')
      .populate('pendingRequests', 'name email photoUrl')
      .lean();

    if (!t) return res.status(404).json({ msg: 'Team not found' });

    res.json({
      ...t,
      memberCount: Array.isArray(t.members) ? t.members.length : 0,
      pendingCount: Array.isArray(t.pendingRequests) ? t.pendingRequests.length : 0,
    });
  } catch (err) {
    console.error('Admin get team error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
