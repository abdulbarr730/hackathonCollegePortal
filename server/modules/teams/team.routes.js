const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const auth     = require('../../core/middlewares/auth');
const teamController = require('./team.controller');

/* ============================================================================
   TEAM ROUTES
   All routes are auth-protected.
   Business logic lives in team.service.js (via team.controller.js).

   Base path (mounted in app.js):  /api/teams

   ⚠️  ROUTE ORDER MATTERS:
       /my-team and /members/leave are static paths and MUST be declared
       before /:id so Express does not treat them as dynamic ID params.
============================================================================ */


// ── Multer — memory storage for logo uploads ─────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });


// ── Static routes (must come before /:id) ────────────────────────────────────

// GET    /api/teams/my-team           — Get the caller's current team
router.get('/my-team', auth, teamController.getMyTeam);

// DELETE /api/teams/members/leave     — Leave the caller's current team
router.delete('/members/leave', auth, teamController.leaveTeam);


// ── Collection routes ─────────────────────────────────────────────────────────

// POST   /api/teams                   — Create a new team (with optional logo)
router.post('/', auth, upload.single('logo'), teamController.createTeam);

// GET    /api/teams                   — Get all teams for the active hackathon
router.get('/', auth, teamController.getAllTeams);


// ── Single-team routes ────────────────────────────────────────────────────────

// GET    /api/teams/:id               — Get a single team by ID
router.get('/:id', auth, teamController.getTeamById);

// PUT    /api/teams/:id               — Update team details (with optional logo swap)
router.put('/:id', auth, upload.single('logo'), teamController.updateTeam);

// DELETE /api/teams/:id               — Delete a team
router.delete('/:id', auth, teamController.deleteTeam);


// ── Member management ─────────────────────────────────────────────────────────

// POST   /api/teams/:id/join          — Send a join request
router.post('/:id/join', auth, teamController.sendJoinRequest);

// POST   /api/teams/:id/cancel-request — Withdraw a join request
router.post('/:id/cancel-request', auth, teamController.cancelJoinRequest);

// POST   /api/teams/:id/approve/:userId — Leader approves a join request
router.post('/:id/approve/:userId', auth, teamController.approveJoinRequest);

// POST   /api/teams/:id/reject/:userId  — Leader rejects a join request
router.post('/:id/reject/:userId', auth, teamController.rejectJoinRequest);

// POST   /api/teams/:id/remove/:memberId — Leader removes a member
router.post('/:id/remove/:memberId', auth, teamController.removeMember);


// ── Logo management ───────────────────────────────────────────────────────────

// DELETE /api/teams/:id/logo          — Remove team logo
router.delete('/:id/logo', auth, teamController.removeLogo);


// ── Submission ────────────────────────────────────────────────────────────────

// POST   /api/teams/:id/submit        — Lock & submit the team
router.post('/:id/submit', auth, teamController.submitTeam);


module.exports = router;