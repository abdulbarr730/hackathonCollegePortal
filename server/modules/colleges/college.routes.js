const express = require('express');
const router = express.Router();

const controller = require('./college.controller');
const auth = require('../../core/middlewares/auth');


// ============================================================================
// REGISTER COLLEGE
// ============================================================================
router.post('/register', controller.registerCollege);

// ============================================================================
// GET PENDING COLLEGES (SUPER ADMIN)
// ============================================================================
router.get('/pending',auth.superAdmin, controller.getPendingColleges);

// ============================================================================
// APPROVE COLLEGE (SUPER ADMIN)
// ============================================================================
router.post('/approve/:id', auth.superAdmin, controller.approveCollege);

module.exports = router;