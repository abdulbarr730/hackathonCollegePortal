const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PreapprovedStudent = require('../models/PreapprovedStudent'); // Make sure this is imported
const auth = require('../middleware/auth');
const { validateSocial } = require('../utils/validators'); // Assuming this validator exists

// --- Multer & Cloudinary Config ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    uploadStream.end(fileBuffer);
  });
};

// --- ROUTES ---

/**
 * @route   POST api/users/check-email
 * @desc    Check if an email is already registered
 * @access  Public
 */
router.post('/check-email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    res.json({ available: !user });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/users/register
 * @desc    Register a new user with auto-verification
 * @access  Public
 */
router.post('/register', upload.single('document'), async (req, res) => {
  const { name, email, password, rollNumber, verificationMethod, gender, year } = req.body;
  try {
    const orQuery = [{ email }];
    if (rollNumber) {
      orQuery.push({ rollNumber });
    }
    const existingUser = await User.findOne({ $or: orQuery });
    if (existingUser) {
      return res.status(400).json({ msg: 'User with this email or Roll Number already exists.' });
    }

    const newUserFields = { name, email, password, verificationMethod, gender, year, rollNumber };

    // Auto-verification logic
    if (rollNumber) {
      const preapproved = await PreapprovedStudent.findOne({ rollNumber });
      if (preapproved) {
        newUserFields.isVerified = true;
      }
    }

    if (verificationMethod === 'documentUpload') {
      if (!req.file) return res.status(400).json({ msg: 'ID card document is required.' });
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      newUserFields.documentUrl = cloudinaryResult.secure_url;
    }
    
    const user = new User(newUserFields);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    const responseMessage = user.isVerified 
      ? 'User registered and automatically verified!' 
      : 'User registered successfully! Awaiting admin approval.';

    res.status(201).json({ msg: responseMessage });
  } catch (err) {
    console.error(`Error in /register: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/users/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Your account has not been verified by an admin yet.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        domain: ".vercel.app",
        path: "/",
        maxAge: 5 * 60 * 60 * 1000,
      }).json({ msg: 'Login successful' });
  } catch (err) {
    console.error(`Error in /login: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/users/logout
 * @desc    Log the user out
 * @access  Private
 */
router.post('/logout', (_req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * @route   POST api/users/forgot-password
 * @desc    Generate and mail a password reset token
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ msg: 'If a user with that email exists, a reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you have requested a password reset. Please click the following link to complete the process:\n\n${resetUrl}`;
    
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: '"SIH Portal" <no-reply@sihportal.com>',
        to: user.email,
        subject: 'Password Reset Request',
        text: message,
    });

    res.json({ msg: 'If a user with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(`Error in /forgot-password: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/users/reset-password/:token
 * @desc    Reset a user's password
 * @access  Public
 */
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: 'Token is invalid or has expired.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ msg: 'Password has been reset successfully.' });
    } catch (err) {
        console.error(`Error in /reset-password: ${err.message}`);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/users/social
 * @desc    Update user's social links
 * @access  Private
 */
router.put('/social', auth, async (req, res) => {
  try {
    const update = validateSocial(req.body || {});
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { socialProfiles: update } },
      { new: true, select: '-password' }
    );
    return res.json({ msg: 'Social links saved', socialProfiles: user.socialProfiles });
  } catch (e) {
    return res.status(400).json({ msg: e.message || 'Invalid data' });
  }
});

/**
 * @route   PUT api/users/profile
 * @desc    Update user's name, email, or year with limits
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  const { name, email, year } = req.body;
  
  try {
    const user = await User.findById(req.user.id);

    // Handle name update (limit: 2)
    if (name && name !== user.name) {
      if (user.nameUpdateCount >= 2) {
        return res.status(403).json({ msg: 'You can no longer change your name.' });
      }
      user.name = name;
      user.nameUpdateCount += 1;
    }

    // Handle academic year update (limit: 4)
    if (year && year !== user.year) {
      if (user.yearUpdateCount >= 4) {
        return res.status(403).json({ msg: 'You can no longer change your academic year.' });
      }
      user.year = year;
      user.yearUpdateCount += 1;
    }

    // Handle email update (unlimited)
    if (email && email !== user.email) {
      // Check if the new email is already taken
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists.id !== user.id) {
        return res.status(400).json({ msg: 'Email is already in use.' });
      }
      user.email = email;
    }
    
    await user.save();
    res.json(user);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/users/change-password
 * @desc    Change user's password
 * @access  Private
 */
router.put('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password.' });
    }

    // Hash and save the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
/**
 * @route   GET api/users/me
 * @desc    Get current logged-in user's data
 * @access  Private
 */
router.get('/me', auth, (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error('Error in /me route:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;