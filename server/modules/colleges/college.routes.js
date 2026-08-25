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
// WORLDWIDE USER SEARCH FOR STAFF ASSIGNMENT
// ============================================================================
router.get('/users/search', adminAuth, controller.searchGlobalUsers);

// ============================================================================
// ADMIN COLLEGE ROUTES
// ============================================================================
router.get('/', adminAuth, controller.listColleges);
router.get('/pending', superAdmin, controller.getPendingColleges);
router.post('/approve/:id', superAdmin, controller.approveCollege);
router.post('/reject/:id', superAdmin, controller.rejectCollege);
router.put('/:id/settings', adminAuth, controller.updateCollegeSettings);

// ============================================================================
// STAFF PROVISIONING & OTP VERIFICATION (ADD/EDIT/DELETE SPOC & ADMINS)
// ============================================================================
router.post('/:id/staff/invite', adminAuth, controller.inviteStaffOtp);
router.post('/:id/staff/verify', adminAuth, controller.verifyStaffOtp);
router.put('/:id/staff/:userId', adminAuth, controller.updateCollegeStaff);
router.delete('/:id/staff/:userId', adminAuth, controller.deleteCollegeStaff);

module.exports = router;
