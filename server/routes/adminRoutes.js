const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { validateSocial } = require('../utils/validators');
const User = require('../models/User');
const Team = require('../models/Team');
const Idea = require('../models/Idea');
const Update = require('../models/Update');
const AdminLog = require('../models/AdminLog');

const adminAuth = require('../middleware/adminAuth');

/* ============================= ADMIN LOGIN ============================= */
// POST /api/admin/login
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

    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: false, // localhost dev
        sameSite: 'lax',
        domain: 'localhost',
        path: '/',
        maxAge: 8 * 60 * 60 * 1000,
      })
      .json({ msg: 'Admin login successful' });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).send('Server Error');
  }
});

/* ================================ METRICS =============================== */
// GET /api/admin/metrics
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

router.get('/debug-env', adminAuth, (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKeySet: process.env.CLOUDINARY_API_KEY ? 'Yes' : 'NO - THIS IS MISSING',
    apiSecretSet: process.env.CLOUDINARY_API_SECRET ? 'Yes' : 'NO - THIS IS THE PROBLEM',
  });
});

/* =============================== IDEAS ================================= */
// GET /api/admin/ideas
router.get('/ideas', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt', status } = req.query; // Added status filter
    const filters = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        filters.status = status;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Idea.find(filters)
        .populate('author', 'name email') // Changed from 'team' to 'author' for clarity
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

// --- APPROVE AND REJECT ROUTES REMOVED AS REQUESTED ---

// ADDED: Admin delete idea route
// DELETE /api/admin/ideas/:id
router.delete('/ideas/:id', adminAuth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ msg: 'Idea not found' });
    }
    
    await Idea.findByIdAndDelete(req.params.id);

    // Optional: Log this action
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


/* =========================== USERS: EXPORTS FIRST ======================= */
// GET /api/admin/users/export.csv
router.get('/users/export.csv', adminAuth, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

    // Excel BOM
    res.write('\uFEFF');

    const filters = {};

    // Header
    res.write('name,email,isAdmin,isVerified,collegeIdNumber,team,createdAt\n');

    const csvEscape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const cursor = User.find(filters)
      .select('name email isAdmin isVerified collegeIdNumber team createdAt')
      .lean()
      .cursor();

    for await (const u of cursor) {
      const row = [
        csvEscape(u.name),
        csvEscape(u.email),
        u.isAdmin ? 'true' : 'false',
        u.isVerified ? 'true' : 'false',
        csvEscape(u.collegeIdNumber),
        csvEscape(u.team ? String(u.team) : ''),
        csvEscape(u.createdAt ? new Date(u.createdAt).toISOString() : ''),
      ].join(',');
      if (!res.write(row + '\n')) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }

    res.end();
  } catch (err) {
    console.error('Admin export CSV error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ msg: 'Export failed', error: err.message });
    }
    try { res.end(); } catch {}
  }
});

// GET /api/admin/users/export.xlsx
router.get('/users/export.xlsx', adminAuth, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');

    const filters = {};

    const cursor = User.find(filters)
      .select('name email isAdmin isVerified collegeIdNumber team createdAt')
      .lean()
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'isAdmin', key: 'isAdmin', width: 10 },
      { header: 'isVerified', key: 'isVerified', width: 12 },
      { header: 'College ID', key: 'collegeIdNumber', width: 18 },
      { header: 'Team', key: 'team', width: 16 },
      { header: 'Created At', key: 'createdAt', width: 24 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle' };

    for await (const u of cursor) {
      sheet.addRow({
        name: u.name || '',
        email: u.email || '',
        isAdmin: u.isAdmin ? 'true' : 'false',
        isVerified: u.isVerified ? 'true' : 'false',
        collegeIdNumber: u.collegeIdNumber || '',
        team: u.team ? String(u.team) : '',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : '',
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Admin export XLSX error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ msg: 'Export failed', error: err.message });
    }
    try { res.end(); } catch {}
  }
});

/* ============================== USERS: LIST ============================= */
// GET /api/admin/users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const {
      q = '',
      verified,  // 'true' | 'false' | undefined
      admin,     // 'true' | 'false' | undefined
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const filters = {};
    if (q) filters.$text = { $search: q };
    if (verified === 'true') filters.isVerified = true;
    if (verified === 'false') filters.isVerified = false;
    if (admin === 'true') filters.isAdmin = true;
    if (admin === 'false') filters.isAdmin = false;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      User.find(filters)
        .select('-password')
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      User.countDocuments(filters),
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
    console.error('Admin list users error:', err);
    res.status(500).send('Server Error');
  }
});

/* =============================== USER: GET ============================== */
// GET /api/admin/users/:id
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

/* ============================ USER: VERIFY ============================== */
// PUT /api/admin/users/:id/verify
router.put('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const { isVerified = true, note = '' } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const from = user.isVerified;
    user.isVerified = !!isVerified;
    await user.save();

    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_VERIFY',
      targetType: 'User',
      targetId: user._id,
      meta: { from, to: user.isVerified, note },
    });

    res.json({ msg: 'User verification updated', user: { _id: user._id, isVerified: user.isVerified } });
  } catch (err) {
    console.error('Admin verify toggle error:', err);
    res.status(500).send('Server Error');
  }
});

/* ──────────────────────────────────────────────────────
    ADMIN: update any user’s social links
    PUT /api/admin/users/:id/social
    ────────────────────────────────────────────────────── */
router.put('/users/:id/social', adminAuth, async (req, res) => {
  try {
    const update = validateSocial(req.body || {});
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { social: update } },
      { new: true, select: '-password' }
    );
    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_SOCIAL_UPDATE',
      targetType: 'User',
      targetId: user._id,
      meta: update,
    });
    res.json({ msg: 'Social links updated', social: user.social });
  } catch (e) {
    res.status(400).json({ msg: e.message || 'Invalid data' });
  }
});

/* ============================ USER: ROLE ================================ */
// PUT /api/admin/users/:id/role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') return res.status(400).json({ msg: 'isAdmin must be boolean' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ msg: 'User not found' });

    const from = target.isAdmin;
    target.isAdmin = isAdmin;
    await target.save();

    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_ROLE_UPDATE',
      targetType: 'User',
      targetId: target._id,
      meta: { from, to: isAdmin },
    });

    res.json({ msg: 'User role updated', user: { _id: target._id, isAdmin: target.isAdmin } });
  } catch (err) {
    console.error('Admin role update error:', err);
    res.status(500).send('Server Error');
  }
});

/* ============================ USER: RESET PWD =========================== */
// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ msg: 'Password must be 8+ chars' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ msg: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    target.password = await bcrypt.hash(newPassword, salt);
    await target.save();

    await AdminLog.create({
      actor: req.user.id,
      action: 'USER_PASSWORD_RESET',
      targetType: 'User',
      targetId: target._id,
      meta: {},
    });

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error('Admin reset password error:', err);
    res.status(500).send('Server Error');
  }
});

/* ============================ USERS: BULK =============================== */
// POST /api/admin/users/bulk-verify
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

// POST /api/admin/users/bulk-delete
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

/* ============================ LEGACY/BASIC ============================== */
// GET /api/admin/users-basic
router.get('/users-basic', adminAuth, async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PUT /api/admin/users/:id/verify-legacy
router.put('/users/:id/verify-legacy', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.isVerified = true;
    await user.save();
    res.json({ msg: 'User verified successfully', user });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    await user.deleteOne();
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/* =============================== TEAMS: ADMIN =========================== */
/* GET /api/admin/teams
    Optional query:
    - q (requires text index if enabled)
    - leader (ObjectId)
    - page, limit, sort
*/
router.get('/teams', adminAuth, async (req, res) => {
  try {
    const {
      q = '',
      leader,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const filters = {};
    if (leader) filters.leader = leader;
    // If you added a text index on Team fields, you can enable this:
    // if (q) filters.$text = { $search: q };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const query = Team.find(filters)
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate('leader', 'name email photoUrl')
      .populate('members', 'name email photoUrl')
      .lean();

    const [items, total] = await Promise.all([
      query.exec(),
      Team.countDocuments(filters),
    ]);

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

// GET /api/admin/teams/:id
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