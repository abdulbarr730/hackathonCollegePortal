/*
===============================================================================
ADMIN CONTROLLER LAYER
===============================================================================

Purpose:
Handles HTTP request/response logic for admin operations.
Acts as the bridge between routes and business logic.
===============================================================================
*/

const adminService = require('./admin.service');

const User = require('../users/user.model');
const Team = require('../teams/team.model');
const Idea = require('../ideas/idea.model');
const Hackathon = require('../hackathons/hackathon.model');
const json2csv = require('json2csv').parse;
const ExcelJS = require('exceljs');


/* ================= LOGIN ================= */
exports.adminLogin = async (req, res) => {
  try {
    const { token, user } = await adminService.loginAdmin(req.body);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    }).json({
      msg: 'Admin login successful',
      token,
      user
    });

  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};


/* ================= METRICS ================= */
exports.getAdminMetrics = async (_req, res) => {
  try {
    res.json(await adminService.getMetrics());
  } catch {
    res.status(500).send('Server Error');
  }
};


/* ================= IDEAS ================= */
exports.listIdeas = async (req, res) => {
  try {
    res.json(await adminService.listIdeas(req.query));
  } catch {
    res.status(500).send('Server Error');
  }
};

exports.deleteIdea = async (req, res) => {
  try {
    await adminService.deleteIdea(req.params.id, req.user.id);
    res.json({ msg: 'Idea deleted successfully' });
  } catch (err) {
    res.status(err.status || 500).send(err.message);
  }
};


/* ================= USERS ================= */
exports.listUsers = async (req, res) => {
  try {
    res.json(await adminService.listUsers(req.query));
  } catch {
    res.status(500).send('Server Error');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body, req.user.id);
    res.json({ msg: 'User updated successfully', user });
  } catch (err) {
    res.status(err.status || 500).send(err.message);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await adminService.deleteUser(req.params.id, req.user.id);
    res.json({ msg: 'User deleted successfully.' });
  } catch (err) {
    res.status(err.status || 500).send(err.message);
  }
};

/* GET SINGLE USER */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('team');

    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).send('Server Error');
  }
};


/* ================= EXPORT USERS ================= */
exports.exportUsers = async (req, res) => {
  try {
    const filters = {};
    const { q = '', verified, admin, role, teamId, collegeId } = req.query;

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
    if (collegeId && collegeId !== 'all') filters.college = collegeId;
    if (teamId) {
      const team = await Team.findById(teamId).select('members').lean();
      filters._id = { $in: team?.members || [] };
    }

    const users = await User.find(filters)
      .select('-password')
      .populate('team', 'teamName')
      .populate('college', 'name shortName')
      .lean();

    const formatted = users.map(u => ({
      Name: u.name,
      Email: u.email,
      Course: u.course || 'N/A',
      Year: u.year || 'N/A',
      RollNumber: u.rollNumber || '',
      Role: u.role,
      Verified: u.isVerified ? 'Yes' : 'No',
      Team: u.team?.teamName || 'N/A',
      College: u.college?.shortName || u.college?.name || 'N/A',
      CreatedAt: new Date(u.createdAt).toLocaleString(),
    }));

    if (req.query.format === 'csv') {
      const csv = json2csv(formatted);
      res.header('Content-Type', 'text/csv').attachment('users.csv').send(csv);
    } else {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Users');
      sheet.columns = Object.keys(formatted[0] || { Name: '' }).map(k => ({ header: k, key: k }));
      formatted.forEach(r => sheet.addRow(r));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');
      await wb.xlsx.write(res);
      res.end();
    }
  } catch {
    res.status(500).send('Server Error');
  }
};


/* ================= BULK ================= */
exports.bulkVerifyUsers = async (req, res) => {
  const r = await adminService.bulkVerify(req.body.ids, req.body.isVerified);
  res.json({ count: r.modifiedCount });
};

exports.bulkDeleteUsers = async (req, res) => {
  const r = await adminService.bulkDelete(req.body.ids);
  res.json({ count: r.deletedCount });
};

exports.bulkAdminUsers = async (req, res) => {
  const r = await adminService.bulkAdmin(req.body.ids, req.body.isAdmin);
  res.json({ count: r.modifiedCount });
};


/* ================= TEAMS ================= */
exports.listTeams = async (req, res) => {
  try {
    const filters = await adminService.buildTeamFilters(req.query);
    const teams = await Team.find(filters)
      .populate('leader members hackathonId')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: teams });
  } catch {
    res.status(500).send('Server Error');
  }
};

exports.unlockTeam = async (req, res) => {
  const team = await Team.findByIdAndUpdate(req.params.id, { isSubmitted:false }, { new:true });
  res.json(team);
};

exports.updateTeamName = async (req, res) => {
  const team = await Team.findByIdAndUpdate(req.params.id,{teamName:req.body.teamName},{new:true});
  res.json(team);
};

exports.changeTeamLeader = async (req, res) => {
  const user = await User.findOne({ email:req.body.email });
  const team = await Team.findById(req.params.id);
  team.leader = user._id;
  if (!team.members.includes(user._id)) team.members.push(user._id);
  await team.save();
  res.json({ msg:'Leader updated' });
};

exports.addTeamMember = async (req,res)=>{
  const user = await User.findOne({email:req.body.email});
  const team = await Team.findById(req.params.id);
  team.members.push(user._id);
  await team.save();
  res.json({msg:'Member added'});
};

exports.removeTeamMember = async (req,res)=>{
  const team = await Team.findById(req.params.teamId);
  team.members = team.members.filter(m=>m.toString()!==req.params.memberId);
  await team.save();
  res.json({msg:'Member removed'});
};

exports.deleteTeam = async (req,res)=>{
  await Team.findByIdAndDelete(req.params.id);
  res.json({msg:'Team deleted'});
};


/* ================= TEAM UTILITIES ================= */
exports.listTeamsSimple = async (_req,res)=>{
  const teams = await Team.find({}).select('teamName hackathonId').populate('hackathonId', 'shortName name').lean();
  res.json(teams.map(t=>({_id:t._id,name:t.teamName})));
};

exports.getTeam = async (req,res)=>{
  const t = await Team.findById(req.params.id)
    .populate('leader members pendingRequests')
    .lean();
  res.json(t);
};


/* ================= TEAM EXPORT ================= */
exports.exportTeams = async (req,res)=>{
  const filters = await adminService.buildTeamFilters(req.query);
  const teams = await Team.find(filters).populate('leader members hackathonId').lean();
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('SIH Teams');
  sheet.columns = [
    { header: 'Hackathon', key: 'hackathon', width: 24 },
    { header: 'Team Name', key: 'team', width: 28 },
    { header: 'Problem Statement', key: 'problem', width: 40 },
    { header: 'Leader Name', key: 'leaderName', width: 24 },
    { header: 'Leader Email', key: 'leaderEmail', width: 30 },
    { header: 'Member Name', key: 'memberName', width: 24 },
    { header: 'Member Email', key: 'memberEmail', width: 30 },
    { header: 'Member Phone', key: 'memberPhone', width: 16 },
    { header: 'Gender', key: 'gender', width: 12 },
    { header: 'Course', key: 'course', width: 12 },
    { header: 'Year', key: 'year', width: 8 },
    { header: 'Submitted', key: 'submitted', width: 12 },
  ];
  teams.forEach(t=>{
    const members = t.members?.length ? t.members : [t.leader].filter(Boolean);
    members.forEach(m=>{
      sheet.addRow({
        hackathon: t.hackathonId?.shortName || t.hackathonId?.name || '',
        team: t.teamName,
        problem: t.problemStatementTitle || '',
        leaderName: t.leader?.name || '',
        leaderEmail: t.leader?.email || '',
        memberName: m.name || '',
        memberEmail: m.email || '',
        memberPhone: m.phone || '',
        gender: m.gender || '',
        course: m.course || '',
        year: m.year || '',
        submitted: t.isSubmitted ? 'Yes' : 'No'
      });
    });
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="sih-teams.xlsx"');
  await wb.xlsx.write(res);
  res.end();
};


/* ================= WINNER ================= */
exports.tagWinner = async (req,res)=>{
  res.json(await adminService.tagWinner(req.params.id,req.body.position));
};

exports.unmarkWinner = async (req,res)=>{
  res.json(await adminService.unmarkWinner(req.params.id));
};
