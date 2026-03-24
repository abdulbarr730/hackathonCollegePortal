const invitationService = require('./invitation.service');

/* ============================================================================
   INVITATION CONTROLLER
   Thin HTTP layer — extracts params, calls the service, and sends the response.
   All business/validation logic lives in invitation.service.js.
   Errors thrown by the service as { status, msg } are forwarded to the client.
============================================================================ */


// =============================================================================
// 1. SEND INVITATION   POST /api/invitations
// =============================================================================
/**
 * Body: { teamId, inviteeId }
 * Auth: Team leader only (enforced inside service)
 */
const sendInvitation = async (req, res) => {
  const { teamId, inviteeId } = req.body;

  try {
    const invitation = await invitationService.sendInvitation(
      teamId,
      inviteeId,
      req.user.id
    );

    res.json(invitation);

  } catch (err) {
    // Structured validation errors come back as { status, msg }
    if (err.status && err.msg) {
      return res.status(err.status).json({ msg: err.msg });
    }
    console.error('Send Invite Error:', err);
    res.status(500).send('Server Error');
  }
};


// =============================================================================
// 2. GET SENT INVITATIONS   GET /api/invitations/sent
// =============================================================================
/**
 * Returns all pending invites sent by the team that the caller leads.
 */
const getSentInvitations = async (req, res) => {
  try {
    const invites = await invitationService.getSentInvitations(req.user.id);
    res.json(invites);

  } catch (err) {
    if (err.status && err.msg) {
      return res.status(err.status).json({ msg: err.msg });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// =============================================================================
// 3. GET RECEIVED INVITATIONS   GET /api/invitations/my-invitations
// =============================================================================
/**
 * Returns all pending invites addressed to the authenticated user.
 */
const getMyInvitations = async (req, res) => {
  try {
    const invites = await invitationService.getMyInvitations(req.user.id);
    res.json(invites);

  } catch (err) {
    if (err.status && err.msg) {
      return res.status(err.status).json({ msg: err.msg });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// =============================================================================
// 4. CANCEL INVITATION   DELETE /api/invitations/:id
// =============================================================================
/**
 * Can be called by the inviter (leader) OR the invitee.
 */
const cancelInvitation = async (req, res) => {
  try {
    const result = await invitationService.cancelInvitation(
      req.params.id,
      req.user.id
    );
    res.json(result);

  } catch (err) {
    if (err.status && err.msg) {
      return res.status(err.status).json({ msg: err.msg });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// =============================================================================
// 5. ACCEPT INVITATION   POST /api/invitations/:id/accept
// =============================================================================
/**
 * Joins the team and wipes all other pending invites for the user (ghost-buster).
 * Runs inside a MongoDB transaction.
 */
const acceptInvitation = async (req, res) => {
  try {
    const result = await invitationService.acceptInvitation(
      req.params.id,
      req.user.id
    );
    res.json(result);

  } catch (err) {
    if (err.status && err.msg) {
      return res.status(err.status).json({ msg: err.msg });
    }
    console.error('Accept Invite Error:', err);
    res.status(500).send('Server Error');
  }
};


// =============================================================================
// 6. REJECT INVITATION   POST /api/invitations/:id/reject
// =============================================================================
/**
 * Deletes the invitation to free the slot and keep the DB clean.
 */
const rejectInvitation = async (req, res) => {
  try {
    const result = await invitationService.rejectInvitation(
      req.params.id,
      req.user.id
    );
    res.json(result);

  } catch (err) {
    if (err.status && err.msg) {
      return res.status(err.status).json({ msg: err.msg });
    }
    console.error(`Error in POST /api/invitations/:id/reject: ${err.message}`);
    res.status(500).send('Server Error');
  }
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  sendInvitation,
  getSentInvitations,
  getMyInvitations,
  cancelInvitation,
  acceptInvitation,
  rejectInvitation,
};