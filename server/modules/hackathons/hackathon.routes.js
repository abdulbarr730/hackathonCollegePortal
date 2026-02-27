const express = require('express');
const router = express.Router();
const Hackathon = require('./hackathon.model');
const Team = require('../teams/team.model');
const auth = require('../../core/middlewares/auth'); // Updated path for auth middleware
const adminAuth = require('../../core/middlewares/adminAuth'); // Updated path for adminAuth middleware
const controller = require('./hackathon.controller');

// ==========================================
// PUBLIC / USER ROUTES
// ==========================================

// 1. GET ACTIVE HACKATHON
router.get('/active', controller.getActiveHackathon);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================

// ==========================================
// 2. GET HACKATHONS (Fixed for Archive Access)
// ==========================================
// REMOVED: adminAuth (So students can see the Archive)
router.get('/all', controller.listHackathons);
// 3. CREATE NEW HACKATHON
router.post('/create', adminAuth, controller.createHackathon);

// 4. SET ACTIVE HACKATHON
router.put('/set-active/:id', adminAuth, controller.setActiveHackathon);

// 5. UPDATE HACKATHON DETAILS
router.put('/update/:id', adminAuth, controller.updateHackathon);

// 6. MIGRATE LEGACY TEAMS
router.put('/migrate-legacy-teams', adminAuth, controller.migrateLegacyTeams);

// ==========================================
// 7. BULK LOCK TEAMS (THE ROUTE YOU WERE MISSING)
// ==========================================
router.put('/lock-all-teams', adminAuth, controller.lockAllTeams);

module.exports = router;