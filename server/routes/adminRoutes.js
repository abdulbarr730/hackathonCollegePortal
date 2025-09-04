const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const json2csv = require('json2csv').parse;
const ExcelJS = require('exceljs'); // ✅ Excel export

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

// =============================
// FIX: Verify / Update a Single User
// =============================
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { isVerified, isAdmin, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (typeof isVerified !== 'undefined') user.isVerified = isVerified;
    if (typeof isAdmin !== 'undefined') user.isAdmin = isAdmin;
    if (role) user.role = role;

    await user.save();

    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_UPDATE',
      targetType: 'User',
      targetId: user._id,
      meta: { isVerified, isAdmin, role },
    });

    res.json({ msg: 'User updated successfully', user });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).send('Server Error');
  }
});

// =============================
// EXPORT USERS (Excel or CSV)
// =============================
router.get('/users/export', adminAuth, async (req, res) => {
  try {
    const { q = '', verified, role, excludeAdmin = 'true', format = 'excel' } = req.query;

    // Filters
    const filters = {};
    if (q) filters.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (typeof verified !== 'undefined') filters.isVerified = verified === 'true';
    if (role) filters.role = role;
    if (excludeAdmin === 'true') filters.isAdmin = { $ne: true };

    // Fetch users
    const users = await User.find(filters).select('-password').populate('team', 'teamName').lean();

    // Fetch all teams for fallback mapping
    const teams = await Team.find().select('teamName members').lean();
    const userToTeamMap = {};
    teams.forEach(team => {
      team.members.forEach(memberId => {
        userToTeamMap[memberId.toString()] = team.teamName;
      });
    });

    // Format user data
    const formattedUsers = users.map(u => ({
      Name: u.name,
      Email: u.email,
      RollNumber: u.rollNumber || '',
      Role: u.role,
      Verified: u.isVerified ? 'Yes' : 'No',
      Team: u.team?.teamName || userToTeamMap[u._id.toString()] || 'N/A',
      CreatedAt: new Date(u.createdAt).toLocaleString(),
    }));

    if (format === 'csv') {
      // CSV Export
      const csv = json2csv(formattedUsers);
      res.header('Content-Type', 'text/csv');
      res.attachment('users.csv');
      return res.send(csv);
    } else {
      // Excel Export
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');

      worksheet.columns = [
        { header: 'Name', key: 'Name', width: 30 },
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'Roll Number', key: 'RollNumber', width: 20 },
        { header: 'Role', key: 'Role', width: 15 },
        { header: 'Verified', key: 'Verified', width: 10 },
        { header: 'Team', key: 'Team', width: 25 },
        { header: 'Created At', key: 'CreatedAt', width: 20 },
      ];

      formattedUsers.forEach(user => worksheet.addRow(user));

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

      await workbook.xlsx.write(res);
      return res.end();
    }
  } catch (err) {
    console.error('Export users error:', err);
    res.status(500).send('Server Error');
  }
});

// =============================
// GET USERS WITH PAGINATION
// =============================
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { q = '', verified, admin, role, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Filters
    const filters = {};
    if (q) filters.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (typeof verified !== 'undefined') filters.isVerified = verified === 'true';
    if (typeof admin !== 'undefined') filters.isAdmin = admin === 'true';
    if (role) filters.role = role;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

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

    const teams = await Team.find().select('teamName members').lean();
    const userToTeamMap = {};
    teams.forEach(team => {
      team.members.forEach(memberId => {
        userToTeamMap[memberId.toString()] = team.teamName;
      });
    });

    const usersWithTeam = users.map(user => ({
      ...user,
      teamName:
        user.team?.teamName ||
        userToTeamMap[user._id.toString()] ||
        'N/A',
    }));

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

// =============================
// GET USER BY ID
// =============================
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

// =============================
// DELETE A SINGLE USER
// =============================
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Important: Check if the user is a team leader
    const ledTeam = await Team.findOne({ leader: userId });
    if (ledTeam) {
      return res.status(400).json({ 
        msg: `Cannot delete user. They are the leader of team "${ledTeam.teamName}". Please change leadership or disband the team first.` 
      });
    }

    // Remove the user from any team they are a member of
    await Team.updateMany({ members: userId }, { $pull: { members: userId } });

    // Now, delete the user
    await User.findByIdAndDelete(userId);

    // Log the administrative action
    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_DELETE',
      targetType: 'User',
      targetId: userId,
      meta: { name: user.name, email: user.email },
    });

    res.json({ msg: 'User deleted successfully.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
    }
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
    // MODIFIED: Added `q` to accept a search query
    const { leader, q, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filters = {};
    
    if (leader) filters.leader = leader;

    // ADDED: Logic to filter by team name if a search query `q` is provided
    if (q) {
      filters.teamName = new RegExp(q, 'i'); // 'i' makes it case-insensitive
    }

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

// =============================
// GET A SIMPLE LIST OF TEAMS FOR FILTERS (NO CHANGES)
// =============================
router.get('/teams/list', adminAuth, async (req, res) => {
  try {
    const teams = await Team.find({}).select('teamName').sort({ teamName: 1 }).lean();
    const formattedTeams = teams.map(t => ({ _id: t._id, name: t.teamName }));
    res.json(formattedTeams);
  } catch (err) {
    console.error('Admin get team list error:', err);
    res.status(500).send('Server Error');
  }
});

// =============================
// GET TEAM BY ID (NO CHANGES)
// =============================
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
