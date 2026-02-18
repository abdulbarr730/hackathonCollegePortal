const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const json2csv = require('json2csv').parse;
const ExcelJS = require('exceljs');

// MODELS
const User = require('../models/User');
const Team = require('../models/Team');
const Idea = require('../models/Idea');
const AdminLog = require('../models/AdminLog');
const Hackathon = require('../models/Hackathon');

// MIDDLEWARE
const adminAuth = require('../middleware/adminAuth');

/* ========================================================================
   1. ADMIN AUTHENTICATION & LOGIN
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
   2. DASHBOARD METRICS
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
   3. IDEAS MANAGEMENT
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
    if (!idea) return res.status(404).json({ msg: 'Idea not found' });

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
   4. USERS MANAGEMENT (CRUD, LOGS, SEARCH)
======================================================================== */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { q = '', verified, admin, role, teamId, page = 1, limit = 15, sort = '-createdAt' } = req.query;
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
      if (team && team.members) filters._id = { $in: team.members };
      else return res.json({ items: [], pagination: { total: 0, pages: 1 } });
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 100);

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

    const items = users.map(user => {
      const yearMap = { 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year' };
      const yearString = user.year ? (yearMap[user.year] || `${user.year}th year`) : '';
      let nameWithYear = user.name;
      if (user.course && yearString) nameWithYear = `${user.name} (${user.course} ${yearString})`;
      else if (yearString) nameWithYear = `${user.name} (${yearString})`;
      return { ...user, nameWithYear };
    });

    res.json({
      items,
      pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { isVerified, isAdmin, role, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
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
      meta: { isVerified, isAdmin, role, passwordChanged: !!password },
    });

    res.json({ msg: 'User updated successfully', user });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).send('Server Error');
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const ledTeam = await Team.findOne({ leader: userId });
    if (ledTeam) {
      return res.status(400).json({ 
        msg: `Cannot delete leader of team "${ledTeam.teamName}". Change leader first.` 
      });
    }

    await Team.updateMany({ members: userId }, { $pull: { members: userId } });
    await User.findByIdAndDelete(userId);

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
    res.status(500).send('Server Error');
  }
});

router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('team');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).send('Server Error');
  }
});


/* ========================================================================
   5. EXPORT ENGINE (EXCEL & CSV)
======================================================================== */
router.get('/users/export', adminAuth, async (req, res) => {
  try {
    const { q = '', verified, role, excludeAdmin = 'true', format = 'excel' } = req.query;
    const filters = {};
    if (q) filters.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (typeof verified !== 'undefined') filters.isVerified = verified === 'true';
    if (role) filters.role = role;
    if (excludeAdmin === 'true') filters.isAdmin = { $ne: true };

    const users = await User.find(filters).select('-password').populate('team', 'teamName').lean();

    const formattedUsers = users.map(u => ({
      Name: u.name,
      Email: u.email,
      Course: u.course || 'N/A',
      Year: u.year || 'N/A',
      RollNumber: u.rollNumber || '',
      Role: u.role,
      Verified: u.isVerified ? 'Yes' : 'No',
      Team: u.team?.teamName || 'N/A',
      CreatedAt: new Date(u.createdAt).toLocaleString(),
    }));

    if (format === 'csv') {
      const csv = json2csv(formattedUsers);
      res.header('Content-Type', 'text/csv').attachment('users.csv').send(csv);
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Users');
      sheet.columns = [
        { header: 'Name', key: 'Name', width: 25 },
        { header: 'Email', key: 'Email', width: 25 },
        { header: 'Course', key: 'Course', width: 15 },
        { header: 'Year', key: 'Year', width: 10 },
        { header: 'Roll Number', key: 'RollNumber', width: 15 },
        { header: 'Verified', key: 'Verified', width: 10 },
        { header: 'Team', key: 'Team', width: 25 },
        { header: 'Joined', key: 'CreatedAt', width: 20 },
      ];
      formattedUsers.forEach(u => sheet.addRow(u));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (err) {
    console.error('Export users error:', err);
    res.status(500).send('Server Error');
  }
});


/* ========================================================================
   6. BULK ACTIONS
======================================================================== */
router.post('/users/bulk-verify', adminAuth, async (req, res) => {
  try {
    const { ids = [], isVerified = true } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ msg: 'ids required' });
    const result = await User.updateMany({ _id: { $in: ids } }, { $set: { isVerified: !!isVerified } });
    res.json({ msg: 'Bulk verify completed', count: result.modifiedCount });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/users/bulk-delete', adminAuth, async (req, res) => {
  try {
    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ msg: 'ids required' });
    const result = await User.deleteMany({ _id: { $in: ids } });
    res.json({ msg: 'Bulk delete completed', count: result.deletedCount });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/users/bulk-admin', adminAuth, async (req, res) => {
  try {
    const { ids = [], isAdmin = true } = req.body;
    const result = await User.updateMany({ _id: { $in: ids } }, { $set: { isAdmin: !!isAdmin } });
    res.json({ msg: 'Bulk admin update completed', count: result.modifiedCount });
  } catch (err) { res.status(500).send('Server Error'); }
});


/* ========================================================================
   7. TEAMS MANAGEMENT (GOD MODE & FILTERING)
======================================================================== */

// SINGLE MERGED ROUTE for getting teams (Handles search, filter, and pagination)
router.get('/teams', adminAuth, async (req, res) => {
  try {
    const { hackathonId, q, page = 1, limit = 50, leader } = req.query;
    const filters = {};
    
    if (hackathonId && hackathonId !== 'all') filters.hackathonId = hackathonId;
    if (q) filters.teamName = new RegExp(q, 'i');
    if (leader) filters.leader = leader;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = parseInt(limit, 10) || 50;

    const [teams, total] = await Promise.all([
      Team.find(filters)
        .populate('leader', 'name email gender')
        .populate('members', 'name email gender')
        .populate('hackathonId', 'name minFemaleMembers')
        .sort({ isSubmitted: -1, createdAt: -1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      Team.countDocuments(filters),
    ]);

    const items = teams.map(team => {
      const femaleCount = team.members.filter(m => ['female', 'f'].includes(m.gender?.toLowerCase())).length;
      return {
        ...team,
        memberCount: team.members.length,
        stats: {
          femaleCount,
          isValidGender: femaleCount >= (team.hackathonId?.minFemaleMembers || 0)
        }
      };
    });

    res.json({ items, pagination: { total, page: pageNum, pages: Math.ceil(total / perPage) } });
  } catch (err) {
    console.error('List teams error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// UNLOCK TEAM (SPOC TOOL)
router.post('/teams/unlock/:id', adminAuth, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, { isSubmitted: false }, { new: true });
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    res.json({ msg: `Team "${team.teamName}" is now unlocked.`, team });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/teams/:id/name', adminAuth, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, { teamName: req.body.teamName }, { new: true });
    res.json(team);
  } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/teams/:id/leader', adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const team = await Team.findById(req.params.id);
    team.leader = user._id;
    if (!team.members.includes(user._id)) team.members.push(user._id);
    await team.save();
    await User.findByIdAndUpdate(user._id, { team: team._id });
    res.json({ msg: 'Leader updated successfully' });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/teams/:id/members', adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || user.team) return res.status(400).json({ msg: 'User unavailable or already in team' });
    const team = await Team.findById(req.params.id);
    if (team.members.length >= 6) return res.status(400).json({ msg: 'Team is full' });
    team.members.push(user._id);
    await team.save();
    user.team = team._id;
    await user.save();
    res.json({ msg: 'Member added manually' });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.delete('/teams/:teamId/members/:memberId', adminAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (team.leader.toString() === req.params.memberId) return res.status(400).json({ msg: 'Cannot remove leader' });
    team.members = team.members.filter(m => m.toString() !== req.params.memberId);
    await team.save();
    await User.findByIdAndUpdate(req.params.memberId, { $unset: { team: "" } });
    res.json({ msg: 'Member kicked' });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.delete('/teams/:id', adminAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    await User.updateMany({ _id: { $in: team.members } }, { $unset: { team: "" } });
    await Team.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Team disbanded' });
  } catch (err) { res.status(500).send('Server Error'); }
});


/* ========================================================================
   8. TEAMS EXPORT (MEMBER PER ROW + AUTO-WIDTH + VISUAL GAPS)
   ======================================================================== */
router.get('/teams/export', adminAuth, async (req, res) => {
  try {
    const { hackathonId } = req.query;
    let filter = (hackathonId && hackathonId !== 'all') ? { hackathonId } : {};

    // 1. Fetch Data
    const teams = await Team.find(filter)
      .populate('leader', 'name email rollNumber gender')
      .populate('members', 'name email rollNumber gender')
      .populate('hackathonId', 'name')
      .lean();

    // 2. Setup Workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Teams Data');

    // 3. Define Columns
    sheet.columns = [
      { header: 'Hackathon Event', key: 'event' },
      { header: 'Team Name', key: 'teamName' },
      { header: 'Status', key: 'status' },
      { header: 'Leader Name', key: 'leaderName' },
      { header: 'Leader Email', key: 'leaderEmail' },
      { header: 'Member Name', key: 'memName' },
      { header: 'Member Email', key: 'memEmail' },
      { header: 'Member Gender', key: 'memGender' },
      { header: 'Role', key: 'role' }
    ];

    // 4. Flatten Data & Add Gaps
    teams.forEach(t => {
      // Loop members
      t.members.forEach(m => {
        sheet.addRow({
          event: t.hackathonId?.name || 'N/A',
          teamName: t.teamName,
          status: t.isSubmitted ? 'Submitted' : 'Draft',
          leaderName: t.leader?.name || 'N/A',
          leaderEmail: t.leader?.email || 'N/A',
          memName: m.name,
          memEmail: m.email,
          memGender: m.gender || 'N/A',
          role: t.leader?._id.toString() === m._id.toString() ? 'LEADER' : 'Member'
        });
      });

      // Handle Empty Teams
      if (t.members.length === 0) {
        sheet.addRow({
          event: t.hackathonId?.name,
          teamName: t.teamName,
          status: 'Empty Team',
          leaderName: t.leader?.name,
          leaderEmail: t.leader?.email,
          memName: 'NO MEMBERS',
          memEmail: '-',
          memGender: '-',
          role: '-'
        });
      }

      // --- THE GAP ---
      // Adds an empty row after every team block
      sheet.addRow([]); 
    });

    // 5. Auto-Expand Columns
    sheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, function(cell) {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });

    let fileName = 'All_Hackathons_Teams.xlsx';

    // If a specific hackathon was selected, fetch its name for the file
    if (hackathonId && hackathonId !== 'all') {
      const activeEvent = await Hackathon.findById(hackathonId);
      if (activeEvent) {
        // Replace spaces with underscores to prevent browser download issues
        const safeName = activeEvent.name.replace(/[^a-zA-Z0-9]/g, '_'); 
        fileName = `${safeName}_Teams.xlsx`;
      }
    }

    // 6. Send Response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Export Error:", err);
    res.status(500).send('Export Error');
  }
});


/* ========================================================================
   9. UTILITY ROUTES
======================================================================== */
router.get('/teams/list', adminAuth, async (req, res) => {
  try {
    const teams = await Team.find({}).select('teamName').sort({ teamName: 1 }).lean();
    res.json(teams.map(t => ({ _id: t._id, name: t.teamName })));
  } catch (err) { res.status(500).send('Server Error'); }
});

router.get('/teams/:id', adminAuth, async (req, res) => {
  try {
    const t = await Team.findById(req.params.id)
      .populate('leader members pendingRequests', 'name email photoUrl')
      .lean();
    if (!t) return res.status(404).json({ msg: 'Team not found' });
    res.json({ ...t, memberCount: t.members.length, pendingCount: t.pendingRequests?.length || 0 });
  } catch (err) { res.status(500).send('Server Error'); }
});


/* ========================================================================
   10. WINNER MANAGEMENT (Tagging Teams)
   ======================================================================== */
router.put('/teams/:id/winner', adminAuth, async (req, res) => {
  try {
    const { position } = req.body; // e.g., "1st Place", "Runner Up", "Gold"
    const team = await Team.findByIdAndUpdate(
      req.params.id, 
      { 
        isWinner: true, 
        winnerPosition: position // You need to add this field to your Team Schema
      }, 
      { new: true }
    );
    res.json({ msg: `Team marked as ${position}`, team });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;