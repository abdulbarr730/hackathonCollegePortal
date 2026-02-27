/*
===============================================================================
ADMIN CONTROLLER LAYER
===============================================================================

Purpose:
Handles HTTP request/response logic for admin operations.
Acts as the bridge between routes and business logic.

Responsibilities:
- Read request data (params, body, query)
- Call appropriate service functions
- Format HTTP responses
- Handle try/catch for request lifecycle
- Set cookies / headers / status codes

What should NOT be here:
✗ Complex business logic
✗ Heavy DB aggregation logic
✗ Reusable domain logic
✗ Multi-step workflows

Controllers should stay thin.
If a function grows beyond simple orchestration,
move the logic into admin.service.js.

Architecture flow:
Route → Controller → Service → DB → Service → Controller → Response

Typical controller pattern:
1. Validate minimal input
2. Call service
3. Return JSON/response
4. Handle errors cleanly

This file answers:
“How does the API respond?”

The service answers:
“How does the system work internally?”

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
    const { token } = await adminService.loginAdmin(req.body);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    }).json({ msg: 'Admin login successful' });

  } catch (err) {
    res.status(err.status || 500).send(err.message || 'Server Error');
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
    const users = await User.find({})
      .select('-password')
      .populate('team', 'teamName')
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
      CreatedAt: new Date(u.createdAt).toLocaleString(),
    }));

    if (req.query.format === 'csv') {
      const csv = json2csv(formatted);
      res.header('Content-Type', 'text/csv').attachment('users.csv').send(csv);
    } else {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Users');
      sheet.columns = Object.keys(formatted[0]).map(k => ({ header: k, key: k }));
      formatted.forEach(r => sheet.addRow(r));
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
    const teams = await Team.find({})
      .populate('leader members hackathonId')
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
  const teams = await Team.find({}).select('teamName').lean();
  res.json(teams.map(t=>({_id:t._id,name:t.teamName})));
};

exports.getTeam = async (req,res)=>{
  const t = await Team.findById(req.params.id)
    .populate('leader members pendingRequests')
    .lean();
  res.json(t);
};


/* ================= TEAM EXPORT ================= */
exports.exportTeams = async (_req,res)=>{
  const teams = await Team.find({}).populate('leader members hackathonId').lean();
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Teams');
  teams.forEach(t=>{
    t.members.forEach(m=>{
      sheet.addRow({
        team:t.teamName,
        leader:t.leader?.name,
        member:m.name
      });
    });
  });
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