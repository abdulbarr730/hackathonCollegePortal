const teamService = require('./team.service');

/* ============================================================================
   CREATE TEAM
============================================================================ */
exports.createTeam = async (req, res) => {
  try {
    const team = await teamService.createTeam({
      userId: req.user.id,
      body: req.body,
      file: req.file
    });

    res.status(201).json(team);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   GET MY TEAM
============================================================================ */
exports.getMyTeam = async (req, res) => {
  try {
    const team = await teamService.getMyTeam({
      userId: req.user.id
    });

    res.json(team);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   GET ALL TEAMS
============================================================================ */
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await teamService.getAllTeams();
    res.json(teams);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   GET TEAM BY ID
============================================================================ */
exports.getTeamById = async (req, res) => {
  try {
    const team = await teamService.getTeamById({
      teamId: req.params.id
    });

    res.json(team);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   UPDATE TEAM DETAILS
============================================================================ */
exports.updateTeam = async (req, res) => {
  try {
    const team = await teamService.updateTeam({
      teamId: req.params.id,
      userId: req.user.id,
      body: req.body,
      file: req.file
    });

    res.json(team);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   REMOVE TEAM LOGO
============================================================================ */
exports.removeLogo = async (req, res) => {
  try {
    const result = await teamService.removeLogo({
      teamId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   SEND JOIN REQUEST
============================================================================ */
exports.sendJoinRequest = async (req, res) => {
  try {
    const result = await teamService.sendJoinRequest({
      teamId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   CANCEL JOIN REQUEST
============================================================================ */
exports.cancelJoinRequest = async (req, res) => {
  try {
    const result = await teamService.cancelJoinRequest({
      teamId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   APPROVE JOIN REQUEST
============================================================================ */
exports.approveJoin = async (req, res) => {
  try {
    const team = await teamService.approveJoin({
      teamId: req.params.id,
      leaderId: req.user.id,
      userId: req.params.userId
    });

    res.json(team);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   REJECT JOIN REQUEST
============================================================================ */
exports.rejectJoinRequest = async (req, res) => {
  try {
    const result = await teamService.rejectJoinRequest({
      teamId: req.params.id,
      leaderId: req.user.id,
      userId: req.params.userId
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   FINAL SUBMIT (LOCK TEAM)
============================================================================ */
exports.submitTeam = async (req, res) => {
  try {
    const result = await teamService.submitTeam({
      teamId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   LEAVE TEAM
============================================================================ */
exports.leaveTeam = async (req, res) => {
  try {
    const result = await teamService.leaveTeam({
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   REMOVE MEMBER
============================================================================ */
exports.removeMember = async (req, res) => {
  try {
    const result = await teamService.removeMember({
      teamId: req.params.id,
      leaderId: req.user.id,
      memberId: req.params.memberId
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   DELETE TEAM
============================================================================ */
exports.deleteTeam = async (req, res) => {
  try {
    const result = await teamService.deleteTeam({
      teamId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};