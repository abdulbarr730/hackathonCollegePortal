const jwt = require('jsonwebtoken');
const authService = require('./auth.service');

/* ============================================================================
   AUTH CONTROLLER
   Thin HTTP layer — extracts params from req, calls auth.service.js,
   and sends the response.
   Error codes thrown by the service are mapped to the correct HTTP status here.
============================================================================ */


// =============================================================================
// 1. REGISTER   POST /api/auth/register
// =============================================================================
/**
 * Passes request body + uploaded file to the register service.
 * The service handles OTP validation, duplicate checks, Cloudinary upload,
 * and user creation inside a transaction.
 */
exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body, req.file);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error in POST /api/auth/register:', err.message);
    res.status(400).json({ msg: err.message });
  }
};


// =============================================================================
// 2. LOGIN   POST /api/auth/login
// =============================================================================
/**
 * Authenticates the user, sets an httpOnly cookie with the JWT,
 * and also returns the token in the response body for clients that
 * prefer header-based auth.
 *
 * Service throws machine-readable codes mapped to HTTP statuses:
 *   USER_NOT_FOUND       → 404
 *   ACCOUNT_NOT_VERIFIED → 403
 *   INVALID_PASSWORD     → 400
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    const isProduction = process.env.NODE_ENV === 'production';

    // Set httpOnly cookie so the token survives page refreshes
    res.cookie('token', result.token, {
      httpOnly: true,
      secure:   isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge:   5 * 60 * 60 * 1000, // 5 hours — matches JWT expiry
    });

    res.json({
      msg:   'Login successful',
      token: result.token,
      user:  result.user,
    });

  } catch (err) {
    console.error('Error in POST /api/auth/login:', err.message);

    const status =
      err.message === 'USER_NOT_FOUND'       ? 404 :
      err.message === 'ACCOUNT_NOT_VERIFIED' ? 403 :
      err.message === 'INVALID_PASSWORD'     ? 400 :
      500;

    res.status(status).json({ msg: err.message });
  }
};


// =============================================================================
// 3. SEND OTP   POST /api/auth/send-otp
// =============================================================================
/**
 * Generates and emails a 6-digit OTP for the given email address.
 */
exports.sendOtp = async (req, res) => {
  try {
    const result = await authService.sendOtp(req.body.email);
    res.json(result);
  } catch (err) {
    console.error('Error in POST /api/auth/send-otp:', err.message);
    res.status(400).json({ msg: err.message });
  }
};


// =============================================================================
// 4. CHECK EMAIL   POST /api/auth/check-email
// =============================================================================
/**
 * Returns { available: true/false } for the given email address.
 */
exports.checkEmail = async (req, res) => {
  try {
    const result = await authService.checkEmail(req.body.email);
    res.json(result);
  } catch (err) {
    console.error('Error in POST /api/auth/check-email:', err.message);
    res.status(400).json({ msg: err.message });
  }
};


// =============================================================================
// 5. FORGOT PASSWORD   POST /api/auth/forgot-password
// =============================================================================
/**
 * Sends a password reset email if the account exists.
 * Always returns a generic message to prevent user enumeration.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json(result);
  } catch (err) {
    console.error('Error in POST /api/auth/forgot-password:', err.message);
    res.status(400).json({ msg: err.message });
  }
};


// =============================================================================
// 6. RESET PASSWORD   POST /api/auth/reset-password/:token
// =============================================================================
/**
 * Validates the reset token and updates the user's password.
 * The raw URL token is passed to the service which hashes it internally
 * before comparing against the stored hash.
 *
 * Service throws:
 *   TOKEN_INVALID_OR_EXPIRED → 400
 */
exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(
      req.params.token,
      req.body.password
    );
    res.json(result);
  } catch (err) {
    console.error('Error in POST /api/auth/reset-password/:token:', err.message);

    const status = err.message === 'TOKEN_INVALID_OR_EXPIRED' ? 400 : 500;
    res.status(status).json({ msg: err.message });
  }
};


// =============================================================================
// 7. LOGOUT   POST /api/auth/logout
// =============================================================================
/**
 * Clears the auth cookie to end the session.
 * No service call needed — purely a cookie operation.
 */
exports.logout = (_req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    console.error('Error in POST /api/auth/logout:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};


// =============================================================================
// 8. GET SUPABASE TOKEN   GET /api/auth/supabase-token
// =============================================================================
/**
 * Issues a short-lived Supabase-compatible JWT for the authenticated user.
 * Returns the token plus the public Supabase config the frontend needs.
 * No service call needed — purely a JWT sign operation.
 * Access: Private (requires auth middleware)
 */
exports.getSupabaseToken = (req, res) => {
  try {
    const payload = {
      id:   req.user.id,
      role: 'authenticated',
      exp:  Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, {
      algorithm: 'HS256',
    });

    res.json({
      token,
      config: {
        supabaseUrl:     process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/auth/supabase-token:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};