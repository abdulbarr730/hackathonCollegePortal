const express = require('express');
const router = express.Router();

const controller = require('./college.controller');
const superAdmin = require('../../core/middlewares/superAdminAuth');
const adminAuth = require('../../core/middlewares/adminAuth');

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
router.get('/public', controller.listPublicColleges);
router.get('/active', controller.listPublicColleges);
router.post('/request-onboarding', controller.requestCollegeOnboarding);

// ============================================================================
// REGISTER COLLEGE (ONBOARDING)
// ============================================================================
router.post('/register', controller.registerCollege);

// ============================================================================
// ADMIN COLLEGE ROUTES
// ============================================================================
router.get('/', adminAuth, controller.listColleges);
router.get('/pending', superAdmin, controller.getPendingColleges);
router.post('/approve/:id', superAdmin, controller.approveCollege);
router.post('/reject/:id', superAdmin, controller.rejectCollege);

// ============================================================================
// STAFF PROVISIONING (ADD COLLEGE ADMIN / SPOC)
// ============================================================================
router.post('/:id/staff', adminAuth, controller.addCollegeStaff);
router.post('/staff', adminAuth, controller.addCollegeStaff);

module.exports = router;
