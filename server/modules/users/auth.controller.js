const authService = require('./auth.service');

// ============================================================================
// REGISTER CONTROLLER
// ============================================================================
exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body, req.file);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

// ============================================================================
// LOGIN CONTROLLER
// ============================================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 5 * 60 * 60 * 1000
    });

    res.json({
      msg: 'Login successful',
      token: result.token,
      user: result.user
    });

  } catch (err) {

    const status =
      err.message === 'USER_NOT_FOUND' ? 404 :
      err.message === 'ACCOUNT_NOT_VERIFIED' ? 403 :
      err.message === 'INVALID_PASSWORD' ? 400 :
      500;

    res.status(status).json({ msg: err.message });
  }
};

// ============================================================================
// SEND OTP CONTROLLER
// ============================================================================
exports.sendOtp = async (req, res) => {
  try {
    const result = await authService.sendOtp(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

// ============================================================================
// CHECK EMAIL CONTROLLER
// ============================================================================
exports.checkEmail = async (req, res) => {
  try {
    const result = await authService.checkEmail(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

// ============================================================================
// FORGOT PASSWORD CONTROLLER
// ============================================================================
exports.forgotPassword = async (req, res) => {
  try {
    const result =
      await authService.forgotPassword(req.body.email);

    res.json(result);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};