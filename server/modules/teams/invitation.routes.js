const express = require('express');
const router  = express.Router();
const auth    = require('../../core/middlewares/auth');
const invitationController = require('./invitation.controller');

/* ============================================================================
   INVITATION ROUTES
   All routes are auth-protected.
   Business logic lives in invitation.service.js (via invitation.controller.js).

   Base path (mounted in app.js):  /api/invitations
============================================================================ */


// POST   /api/invitations             — Send an invitation (leader only)
router.post('/', auth, invitationController.sendInvitation);

// GET    /api/invitations/sent        — Pending invites sent by caller's team
router.get('/sent', auth, invitationController.getSentInvitations);

// GET    /api/invitations/my-invitations — Pending invites received by caller
router.get('/my-invitations', auth, invitationController.getMyInvitations);

// DELETE /api/invitations/:id         — Cancel invite (inviter OR invitee)
router.delete('/:id', auth, invitationController.cancelInvitation);

// POST   /api/invitations/:id/accept  — Accept an invitation
router.post('/:id/accept', auth, invitationController.acceptInvitation);

// POST   /api/invitations/:id/reject  — Reject an invitation
router.post('/:id/reject', auth, invitationController.rejectInvitation);


module.exports = router;