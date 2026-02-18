const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const nodemailer = require('nodemailer');
const { sendEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PreapprovedStudent = require('../models/PreapprovedStudent'); 
const Invitation = require('../models/Invitation');
const auth = require('../middleware/auth');

const Otp = require('../models/Otp');
const { validateSocial } = require('../utils/validators');

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


/**
 * @route   GET /api/auth/supabase-token
 * @desc    Generate a custom Supabase JWT for the current user
 * @access  Private
 */
router.get('/supabase-token', auth, async (req, res) => {
    try {
        const payload = {
            id: req.user.id,
            role: 'authenticated', // Must be 'authenticated' or a custom role
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
        };
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        
        // This is the new, separate secret for Supabase
        const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, { algorithm: 'HS256' });

        const supabaseConfig = { supabaseUrl, supabaseAnonKey };
        
        res.json({ token, config: supabaseConfig });
    } catch (err) {
        console.error('Error generating Supabase token:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route   POST api/users/send-otp
 * @desc    Generate and email a 6-digit verification code
 * @access  Public
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email is already registered. Please login.' });
    }

    // 2. Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save to DB (Update if an OTP already exists for this email)
    // upsert: true means create if not found
    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 4. Send the Email
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Verification Code</h2>
        <p>Your verification code for the SIH Portal is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; background: #f3f4f6; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Your Verification Code',
      html: message
    });

    res.json({ msg: 'Verification code sent successfully' });

  } catch (err) {
    console.error(`Error in /send-otp: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

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
 * @desc    Register a new user with OTP & Document verification
 * @access  Public
 */
router.post('/register', upload.single('document'), async (req, res) => {
  try {
    // 1. Extract all fields including OTP
    const { 
      name, email, password, otp, // <--- Added otp here
      rollNumber, verificationMethod, gender, year, course 
    } = req.body;

    // --- OTP VERIFICATION BLOCK START ---
    if (!otp) {
      return res.status(400).json({ msg: 'Verification code is required.' });
    }

    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ msg: 'Invalid or expired verification code.' });
    }

    // Delete the OTP so it can't be used again
    await Otp.deleteOne({ _id: validOtp._id });
    // --- OTP VERIFICATION BLOCK END ---


    // 2. Existing Validation Logic
    const orQuery = [{ email }];
    if (rollNumber) orQuery.push({ rollNumber });
    
    const existingUser = await User.findOne({ $or: orQuery });
    if (existingUser) {
      return res.status(400).json({ msg: 'User with this email or Roll Number already exists.' });
    }

    // 3. Prepare User Fields
    const newUserFields = { 
      name, email, password, verificationMethod, 
      gender, year, course, rollNumber 
    };

    // 4. Check Pre-approved List
    if (rollNumber) {
      const preapproved = await PreapprovedStudent.findOne({ rollNumber });
      if (preapproved) newUserFields.isVerified = true;
    }

    // 5. Handle Document Upload
    if (verificationMethod === 'documentUpload') {
      if (!req.file) return res.status(400).json({ msg: 'ID card document is required.' });
      
      // Upload to Cloudinary (Ensure this function is imported)
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer); 
      newUserFields.documentUrl = cloudinaryResult.secure_url;
    }
    
    // 6. Create and Save User
    const user = new User(newUserFields);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    // 7. Send Response
    const responseMessage = user.isVerified 
      ? 'User registered and automatically verified!' 
      : 'User registered successfully! Awaiting admin approval.';

    res.status(201).json({ msg: responseMessage, isVerified: user.isVerified });

  } catch (err) {
    console.error(`Error in /register: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/users/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Find user by email
    const user = await User.findOne({ email });

    // 2. Handle Case: User's email is not found in the database
    if (!user) {
      // Send the specific error code the frontend is looking for
      return res.status(404).json({ msg: 'USER_NOT_FOUND' });
    }

    // 3. Handle Case: User exists but their account is not yet verified
    if (!user.isVerified) {
      // You can also create a custom message for this on the frontend
      return res.status(403).json({ msg: 'ACCOUNT_NOT_VERIFIED' });
    }

    // 4. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    // 5. Handle Case: Password does not match
    if (!isMatch) {
      // Send the specific error code for an invalid password
      return res.status(400).json({ msg: 'INVALID_PASSWORD' });
    }

    // --- Success Case: Credentials are valid ---
    const payload = { user: { id: user.id, isAdmin: user.isAdmin } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // true in prod, false in dev
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site prod, 'lax' for same-site local
      path: "/",
      maxAge: 5 * 60 * 60 * 1000,
    }).json({ 
      msg: 'Login successful',
      token, // Send token in body as a backup for the frontend context
      user: { id: user.id, isAdmin: user.isAdmin } 
    });

  } catch (err) {
    console.error(`Error in /login: ${err.message}`);
    res.status(500).json({ error: 'Server Error' });
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

    // Security: Always return success message even if user doesn't exist
    if (!user) {
      return res.json({ msg: 'If a user with that email exists, a reset link has been sent.' });
    }

    // 1. Generate Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 2. Hash and Save
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // 3. Create URL (Use CLIENT_URL from env, or fallback to localhost)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // 4. Create Email Content (HTML is better)
    const message = `
      <h3>Password Reset Request</h3>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4F46E5;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>Or copy this link:</p>
      <p>${resetUrl}</p>
      <p>This link is valid for 15 minutes.</p>
    `;

    // 5. Send Email using Nodemailer (The utility we created)
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: message,
    });

    if (!emailResult.success) {
        // If email fails, cleanup the token so user can try again
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return res.status(500).json({ msg: 'Email could not be sent. Please try again later.' });
    }

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
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ msg: 'Token is invalid or has expired.' });

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
  const { name, email, year, course } = req.body;
  
  try {
    const user = await User.findById(req.user.id);

    if (name && name !== user.name) {
      if (user.nameUpdateCount >= 2) return res.status(403).json({ msg: 'You can no longer change your name.' });
      user.name = name;
      user.nameUpdateCount += 1;
    }

    if (course && course !== user.course) {
      // Optional: Limit how many times they can change the course
      if (user.courseUpdateCount >= 4) return res.status(403).json({ msg: 'You can no longer change your course.' });
      user.course = course;
      user.courseUpdateCount += 1;
    }

    if (year && year !== user.year) {
      if (user.yearUpdateCount >= 4) return res.status(403).json({ msg: 'You can no longer change your academic year.' });
      user.year = year;
      user.yearUpdateCount += 1;
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists.id !== user.id) return res.status(400).json({ msg: 'Email is already in use.' });
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
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password.' });

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

/**
 * @route   GET /api/users
 * @desc    Get all users with optional filters, mark if invited
 * @query   year, search
 * @access  Public or Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { year, search, course } = req.query;
    const filter = { role: 'student' }; // ✅ only include students

    if (year) filter.year = Number(year);
    if (course) filter.course = course;
    if (search)
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];

    const users = await User.find(filter)
      .select('name email year course photoUrl team socialProfiles isVerified role');

    // Existing code: check if current user has a team and mark invites
    const currentUser = await User.findById(req.user.id).populate('team');
    if (currentUser.team) {
      const pendingInvites = await Invitation.find({
        teamId: currentUser.team._id,
        status: 'pending'
      }).select('inviteeId').lean();

      const inviteeIds = new Set(pendingInvites.map(i => i.inviteeId.toString()));
      users.forEach(u => {
        u.isInvited = inviteeIds.has(u._id.toString());
      });
    } else {
      users.forEach(u => (u.isInvited = false));
    }

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
