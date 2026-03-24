const teamService = require('./team.service');

/* ============================================================================
   TEAM CONTROLLER
   Thin HTTP layer — extracts params from req, delegates to team.service.js,
   and sends the response.
   All business / validation logic lives in team.service.js.
   Structured errors { status, msg } thrown by the service are forwarded as-is.
============================================================================ */


// ---------------------------------------------------------------------------
// HELPER — forward structured service errors or fall through to 500
// ---------------------------------------------------------------------------
const handleError = (err, res, label) => {
  if (err.status && err.msg) {
    return res.status(err.status).json({ msg: err.msg });
  }
  console.error(`${label}:`, err);
  // Handle MongoDB duplicate-key race condition on team name
  if (err.code === 11000) {
    return res.status(400).json({ msg: 'Team name already exists in this hackathon.' });
  }
  res.status(500).send('Server Error');
};


// =============================================================================
// 1. CREATE TEAM   POST /api/teams
// =============================================================================
const createTeam = async (req, res) => {
  try {
    const fields     = req.body;
    const fileBuffer = req.file ? req.file.buffer : null;

    const team = await teamService.createTeam(fields, req.user.id, fileBuffer);
    res.status(201).json(team);

  } catch (err) {
    handleError(err, res, 'Error in POST /api/teams');
  }
};


// =============================================================================
// 2. GET ALL TEAMS   GET /api/teams
// =============================================================================
const getAllTeams = async (req, res) => {
  try {
    const teams = await teamService.getAllTeams();
    res.json(teams);

  } catch (err) {
    handleError(err, res, 'Error in GET /api/teams');
  }
};


// =============================================================================
// 3. GET MY TEAM   GET /api/teams/my-team
// =============================================================================
const getMyTeam = async (req, res) => {
  try {
    const team = await teamService.getMyTeam(req.user.id);
    res.json(team);

  } catch (err) {
    handleError(err, res, 'Error in GET /api/teams/my-team');
  }
};


// =============================================================================
// 4. GET TEAM BY ID   GET /api/teams/:id
// =============================================================================
const getTeamById = async (req, res) => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    res.json(team);

  } catch (err) {
    handleError(err, res, 'Error in GET /api/teams/:id');
  }
};


// =============================================================================
// 5. UPDATE TEAM   PUT /api/teams/:id
// =============================================================================
const updateTeam = async (req, res) => {
  try {
    const fileBuffer = req.file ? req.file.buffer : null;

    const team = await teamService.updateTeam(
      req.params.id,
      req.body,
      req.user.id,
      fileBuffer
    );
    res.json(team);

  } catch (err) {
    handleError(err, res, 'Error in PUT /api/teams/:id');
  }
};


// =============================================================================
// 6. DELETE TEAM   DELETE /api/teams/:id
// =============================================================================
const deleteTeam = async (req, res) => {
  try {
    const result = await teamService.deleteTeam(req.params.id, req.user.id);
    res.json(result);

  } catch (err) {
    handleError(err, res, 'Error in DELETE /api/teams/:id');
  }
};


// =============================================================================
// 7. SEND JOIN REQUEST   POST /api/teams/:id/join
// =============================================================================
const sendJoinRequest = async (req, res) => {
  try {
    const team = await teamService.sendJoinRequest(req.params.id, req.user.id);
    res.json(team);

  } catch (err) {
    handleError(err, res, 'Error in POST /api/teams/:id/join');
  }
};


// =============================================================================
// 8. CANCEL JOIN REQUEST   POST /api/teams/:id/cancel-request
// =============================================================================
const cancelJoinRequest = async (req, res) => {
  try {
    const result = await teamService.cancelJoinRequest(req.params.id, req.user.id);
    res.json(result);

  } catch (err) {
    handleError(err, res, 'Error in POST /api/teams/:id/cancel-request');
  }
};


// =============================================================================
// 9. APPROVE JOIN REQUEST   POST /api/teams/:id/approve/:userId
// =============================================================================
const approveJoinRequest = async (req, res) => {
  try {
    const team = await teamService.approveJoinRequest(
      req.params.id,
      req.params.userId,
      req.user.id
    );
    res.json(team);

  } catch (err) {
    handleError(err, res, 'Error in POST /api/teams/:id/approve/:userId');
  }
};


// =============================================================================
// 10. REJECT JOIN REQUEST   POST /api/teams/:id/reject/:userId
// =============================================================================
const rejectJoinRequest = async (req, res) => {
  try {
    const result = await teamService.rejectJoinRequest(
      req.params.id,
      req.params.userId,
      req.user.id
    );
    res.json(result);

  } catch (err) {
    handleError(err, res, 'Error in POST /api/teams/:id/reject/:userId');
  }
};


// =============================================================================
// 11. LEAVE TEAM   DELETE /api/teams/members/leave
// =============================================================================
const leaveTeam = async (req, res) => {
  try {
    const result = await teamService.leaveTeam(req.user.id);
    res.json(result);

  } catch (err) {
    handleError(err, res, 'Error in DELETE /api/teams/members/leave');
  }
};


// =============================================================================
// 12. REMOVE MEMBER   POST /api/teams/:id/remove/:memberId
// =============================================================================
const removeMember = async (req, res) => {
  try {
    const result = await teamService.removeMember(
      req.params.id,
      req.params.memberId,
      req.user.id
    );
    res.json(result);

  } catch (err) {
    handleError(err, res, 'Error in POST /api/teams/:id/remove/:memberId');
  }
};


// =============================================================================
// 13. REMOVE LOGO   DELETE /api/teams/:id/logo
// =============================================================================
const removeLogo = async (req, res) => {
  try {
    const team = await teamService.removeLogo(req.params.id, req.user.id);
    res.json(team);

  } catch (err) {
    handleError(err, res, 'Error in DELETE /api/teams/:id/logo');
  }
};


// =============================================================================
// 14. SUBMIT TEAM   POST /api/teams/:id/submit
// =============================================================================
const submitTeam = async (req, res) => {
  try {
    const result = await teamService.submitTeam(req.params.id, req.user.id);
    res.json(result);

  } catch (err) {
    handleError(err, res, 'Error in POST /api/teams/:id/submit');
  }
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  createTeam,
  getAllTeams,
  getMyTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  sendJoinRequest,
  cancelJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  leaveTeam,
  removeMember,
  removeLogo,
  submitTeam,
};