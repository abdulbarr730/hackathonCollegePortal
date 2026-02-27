/*
===============================================================================
ADMIN ROUTES FILE
===============================================================================

Purpose:
Defines all HTTP endpoints available for admin operations.

This file acts as the routing table for the admin module.
It maps URL paths → controller functions and applies middleware.

All endpoints here are mounted under:
    /api/admin

So final URLs look like:
    POST   /api/admin/login
    GET    /api/admin/users
    PUT    /api/admin/teams/:id
    etc.

-------------------------------------------------------------------------------
WHAT THIS FILE CONTAINS
-------------------------------------------------------------------------------

1. AUTH
   POST   /login
   → Admin login endpoint (no auth middleware)

2. DASHBOARD
   GET    /metrics
   → Dashboard stats for admin panel

3. IDEAS MANAGEMENT
   GET    /ideas
   DELETE /ideas/:id

4. USERS MANAGEMENT
   GET    /users
   GET    /users/:id
   PUT    /users/:id
   DELETE /users/:id

5. USERS EXPORT
   GET    /users/export

6. BULK USER ACTIONS
   POST   /users/bulk-verify
   POST   /users/bulk-delete
   POST   /users/bulk-admin

7. TEAMS MANAGEMENT
   GET    /teams
   POST   /teams/unlock/:id
   PUT    /teams/:id/name
   PUT    /teams/:id/leader
   POST   /teams/:id/members
   DELETE /teams/:teamId/members/:memberId
   DELETE /teams/:id

8. TEAMS EXPORT
   GET    /teams/export

9. TEAM UTILITIES
   GET    /teams/list
   GET    /teams/:id

10. WINNER MANAGEMENT
   PUT    /teams/:id/winner
   DELETE /teams/:id/winner

-------------------------------------------------------------------------------
ARCHITECTURE FLOW

Client → Route → Controller → Service → DB

Routes should ONLY:
- define endpoints
- attach middleware
- call controller functions

No business logic should live here.

===============================================================================
*/

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const json2csv = require('json2csv').parse;
const ExcelJS = require('exceljs');


const adminController = require('./admin.controller');
// MODELS
const User = require('../users/user.model');
const Team = require('../teams/team.model');
const Idea = require('../ideas/idea.model');
const AdminLog = require('./adminLog.model');
const Hackathon = require('../hackathons/hackathon.model');

// MIDDLEWARE
const adminAuth = require('../../core/middlewares/adminAuth'); // Updated path for adminAuth middleware

/* ========================================================================
   1. ADMIN AUTHENTICATION & LOGIN
======================================================================== */
router.post('/login', adminController.adminLogin);


/* ========================================================================
   2. DASHBOARD METRICS
======================================================================== */
router.get('/metrics', adminAuth, adminController.getAdminMetrics);


/* ========================================================================
   3. IDEAS MANAGEMENT
======================================================================== */
router.get('/ideas', adminAuth, adminController.listIdeas);

router.delete('/ideas/:id', adminAuth, adminController.deleteIdea);


/* ========================================================================
   4. USERS MANAGEMENT (CRUD, LOGS, SEARCH)
======================================================================== */
router.get('/users', adminAuth, adminController.listUsers);

router.put('/users/:id', adminAuth, adminController.updateUser);

router.delete('/users/:id', adminAuth, adminController.deleteUser);

router.get('/users/:id', adminAuth, adminController.getUser);


/* ========================================================================
   5. EXPORT ENGINE (EXCEL & CSV)
======================================================================== */
router.get('/users/export', adminAuth, adminController.exportUsers);


/* ========================================================================
   6. BULK ACTIONS
======================================================================== */
router.post('/users/bulk-verify', adminAuth, adminController.bulkVerifyUsers);

router.post('/users/bulk-delete', adminAuth, adminController.bulkDeleteUsers);

router.post('/users/bulk-admin', adminAuth, adminController.bulkAdminUsers);


/* ========================================================================
   7. TEAMS MANAGEMENT (GOD MODE & FILTERING)
======================================================================== */

// SINGLE MERGED ROUTE for getting teams (Handles search, filter, and pagination)
router.get('/teams', adminAuth, adminController.listTeams);

// UNLOCK TEAM (SPOC TOOL)
router.post('/teams/unlock/:id', adminAuth, adminController.unlockTeam);

router.put('/teams/:id/name', adminAuth, adminController.updateTeamName);

router.put('/teams/:id/leader', adminAuth, adminController.changeTeamLeader);

router.post('/teams/:id/members', adminAuth, adminController.addTeamMember);

router.delete('/teams/:teamId/members/:memberId', adminAuth, adminController.removeTeamMember);

router.delete('/teams/:id', adminAuth, adminController.deleteTeam);


/* ========================================================================
   8. TEAMS EXPORT (MEMBER PER ROW + AUTO-WIDTH + VISUAL GAPS)
   ======================================================================== */
router.get('/teams/export', adminAuth, adminController.exportTeams);


/* ========================================================================
   9. UTILITY ROUTES
======================================================================== */
router.get('/teams/list', adminAuth, adminController.listTeamsSimple);

router.get('/teams/:id', adminAuth, adminController.getTeam);


/* ========================================================================
   10. WINNER MANAGEMENT (Tagging Teams)
   ======================================================================== */
router.put('/teams/:id/winner', adminAuth, adminController.tagWinner);
router.delete('/teams/:id/winner', adminAuth, adminController.unmarkWinner);

module.exports = router;