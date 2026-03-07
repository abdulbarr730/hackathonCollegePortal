const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const auth = require('../../core/middlewares/auth');
const User = require('./user.model');
const Otp = require('../auth/otp.model');
const PreapprovedStudent = require('./prepprovedStudent.model');
const { sendEmail } = require('../../shared/services/email.service');
const cloudinary = require('../../shared/services/cloudinary.service');

const controller = require('./auth.controller');

// ============================================================================
// MULTER CONFIG (Memory Storage)
// ============================================================================
const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};


/* ============================================================================
   GET SUPABASE TOKEN
============================================================================ */
router.get('/supabase-token', auth, async (req, res) => {
  try {
    const payload = {
      id: req.user.id,
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    };

    const token = jwt.sign(
      payload,
      process.env.SUPABASE_JWT_SECRET,
      { algorithm: 'HS256' }
    );

    res.json({
      token,
      config: {
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
      }
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});


/* ============================================================================
   SEND OTP
============================================================================ */
router.post('/send-otp', controller.sendOtp);


/* ============================================================================
   CHECK EMAIL AVAILABILITY
============================================================================ */
router.post('/check-email', controller.checkEmail);


// ============================================================================
// REGISTER ROUTE
// ============================================================================
router.post('/register',upload.single('document'),controller.register);



/* ============================================================================
   LOGIN USER
============================================================================ */
router.post('/login', controller.login);


/* ============================================================================
   LOGOUT USER
============================================================================ */
router.post('/logout', (_req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});


/* ============================================================================
   FORGOT PASSWORD
============================================================================ */
router.post('/forgot-password', controller.forgotPassword);


/* ============================================================================
   RESET PASSWORD
============================================================================ */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;

    const hashedToken =
      crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ msg: 'Token is invalid or has expired.' });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({ msg: 'Password has been reset successfully.' });

  } catch (err) {
    res.status(500).send('Server Error');
  }
});


module.exports = router;