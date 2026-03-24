const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const auth    = require('../../core/middlewares/auth');
const controller = require('./auth.controller');

/* ============================================================================
   AUTH ROUTES
   All business logic lives in auth.service.js (via auth.controller.js).
   Base path (mounted in app.js):  /api/auth
============================================================================ */


// ── Multer — memory storage for document uploads on registration ─────────────
const upload = multer({ storage: multer.memoryStorage() });


// GET  /api/auth/supabase-token        — Issue a short-lived Supabase JWT
router.get('/supabase-token', auth, controller.getSupabaseToken);

// POST /api/auth/send-otp              — Send OTP to email for verification
router.post('/send-otp', controller.sendOtp);

// POST /api/auth/check-email           — Check if an email is available
router.post('/check-email', controller.checkEmail);

// POST /api/auth/register              — Register new user (with optional document upload)
router.post('/register', upload.single('document'), controller.register);

// POST /api/auth/login                 — Login and receive JWT (cookie + body)
router.post('/login', controller.login);

// POST /api/auth/logout                — Clear auth cookie
router.post('/logout', controller.logout);

// POST /api/auth/forgot-password       — Send password reset email
router.post('/forgot-password', controller.forgotPassword);

// POST /api/auth/reset-password/:token — Reset password using email link token
router.post('/reset-password/:token', controller.resetPassword);


module.exports = router;