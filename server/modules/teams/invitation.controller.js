const invitationService = require('./invitation.service');

/* ============================================================================
   SEND INVITATION
============================================================================ */
exports.sendInvitation = async (req, res) => {
  try {
    const invitation = await invitationService.sendInvitation({
      teamId: req.body.teamId,
      inviterId: req.user.id,
      inviteeId: req.body.inviteeId
    });

    res.json(invitation);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   ACCEPT INVITATION
============================================================================ */
exports.acceptInvitation = async (req, res) => {
  try {
    const result = await invitationService.acceptInvitation({
      invitationId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   CANCEL INVITATION
============================================================================ */
exports.cancelInvitation = async (req, res) => {
  try {
    const result = await invitationService.cancelInvitation({
      invitationId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   REJECT INVITATION
============================================================================ */
exports.rejectInvitation = async (req, res) => {
  try {
    const result = await invitationService.rejectInvitation({
      invitationId: req.params.id,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

/* ============================================================================
   GET SENT INVITATIONS (FOR TEAM LEADER)
============================================================================ */
exports.getSentInvitations = async (req, res) => {
  try {
    const invites = await invitationService.getSentInvitations({
      userId: req.user.id
    });

    res.json(invites);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};


/* ============================================================================
   GET RECEIVED INVITATIONS (FOR USER)
============================================================================ */
exports.getMyInvitations = async (req, res) => {
  try {
    const invites = await invitationService.getMyInvitations({
      userId: req.user.id
    });

    res.json(invites);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};