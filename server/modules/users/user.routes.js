const express = require('express');
const router  = express.Router();
const auth    = require('../../core/middlewares/auth');
const controller = require('./user.controller');

/* ============================================================================
   USER ROUTES
   All business logic lives in user.service.js (via user.controller.js).
   Base path (mounted in app.js / server.js):  /api/users

   The following endpoints that previously lived here have been moved:
     POST /send-otp            → /api/auth/send-otp
     POST /check-email         → /api/auth/check-email
     POST /register            → /api/auth/register
     POST /login               → /api/auth/login
     POST /logout              → /api/auth/logout
     POST /forgot-password     → /api/auth/forgot-password
     POST /reset-password/:token → /api/auth/reset-password/:token
     GET  /supabase-token      → /api/auth/supabase-token
     POST /photo               → /api/profile/photo
     DELETE /photo             → /api/profile/photo
============================================================================ */


// GET  /api/users/me              — Get the authenticated user's own data
router.get('/me', auth, controller.getMe);

// GET  /api/users                 — Get all students (with optional filters)
router.get('/', auth, controller.getAllUsers);

// PUT  /api/users/profile         — Update profile fields (name, email, year, course)
router.put('/profile', auth, controller.updateProfile);

// PUT  /api/users/social          — Update social profile links
router.put('/social', auth, controller.updateSocial);

// PUT  /api/users/change-password — Change password (requires current password)
router.put('/change-password', auth, controller.changePassword);

// PUT  /api/users/update-phone    — Add or update phone number
router.put('/update-phone', auth, controller.updatePhone);


module.exports = router;