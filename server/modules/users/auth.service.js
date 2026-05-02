const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./user.model');
const Otp = require('../auth/otp.model');
const PreapprovedStudent = require('./prepprovedStudent.model');
const cloudinary = require('../../shared/services/cloudinary.service');
const withTransaction = require('../../shared/utils/withTransaction');
const { sendEmail } = require('../../shared/services/email.service');

/* ============================================================================
   AUTH SERVICE
   Pure business logic — no req/res. Called by auth.controller.js.
   Throws plain Error instances with either a human-readable message or a
   machine-readable code (e.g. 'USER_NOT_FOUND') so the controller can map
   them to the right HTTP status.
============================================================================ */


// =============================================================================
// 1. REGISTER (transactional)
// =============================================================================
/**
 * Validates OTP, checks for duplicate accounts, optionally uploads an ID
 * document to Cloudinary, hashes the password, and saves the new User.
 *
 * Runs inside a transaction so that OTP deletion + user creation are atomic.
 *
 * @param {object} data - Flattened req.body fields
 * @param {object|null} file - Multer file object (req.file), or null
 * @returns {Promise<{ msg: string, isVerified: boolean }>}
 */
exports.register = async (data, file) => {
  return withTransaction(async (session) => {

    const {
        name,
        email,
        password,
        otp,
        rollNumber,
        verificationMethod,
        gender,
        year,
        course,
        phone
      } = data;

    if (!otp) throw new Error('Verification code is required.');

    // ── OTP validation ────────────────────────────────────────────────────────
    const validOtp = await Otp.findOne({ email, otp }).session(session);
    if (!validOtp) throw new Error('Invalid or expired verification code.');

    // Consume the OTP so it cannot be reused
    await Otp.deleteOne({ _id: validOtp._id }).session(session);

    // ── Duplicate account check ───────────────────────────────────────────────
    const existingUser = await User.findOne({
      $or: [
        { email },
        rollNumber ? { rollNumber } : null,
      ].filter(Boolean),
    }).session(session);

    if (existingUser) throw new Error('User already exists.');

    const newUserFields = {
      name,
      email,
      gender,
      year,
      course,
      rollNumber,
      verificationMethod,

      phone: phone || '',
      mustAddPhone: phone ? false : true,
    };

    // ── Pre-approved student check ────────────────────────────────────────────
    // If the roll number exists in the pre-approved list, auto-verify the account
    if (rollNumber) {
      const preapproved = await PreapprovedStudent
        .findOne({ rollNumber })
        .session(session);

      if (preapproved) newUserFields.isVerified = true;
    }

    // ── Document upload to Cloudinary ─────────────────────────────────────────
    if (verificationMethod === 'documentUpload') {
      if (!file) throw new Error('ID card document is required.');

      const b64     = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'app/documents',
      });

      newUserFields.documentUrl = result.secure_url;
    }

    // ── Hash password & persist ───────────────────────────────────────────────
    const user = new User(newUserFields);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save({ session });

    return {
      msg: user.isVerified
        ? 'User registered and automatically verified!'
        : 'User registered successfully! Awaiting admin approval.',
      isVerified: user.isVerified,
    };
  });
};


// =============================================================================
// 2. LOGIN
// =============================================================================
/**
 * Verifies credentials and returns a signed JWT + basic user info.
 * Throws machine-readable error codes so the controller can map them to
 * the correct HTTP status without string-matching human messages.
 *
 * @param {string} email
 * @param {string} password - Plain-text password from the request
 * @returns {Promise<{ token: string, user: { id: string, isAdmin: boolean } }>}
 */
exports.login = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user)          throw new Error('USER_NOT_FOUND');
  if (!user.isVerified) throw new Error('ACCOUNT_NOT_VERIFIED');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('INVALID_PASSWORD');

  const payload = {
    user: {
      id: user.id,
      isAdmin: user.isAdmin,
      mustAddPhone: user.mustAddPhone
    },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '5h',
  });

  return {
    token,
    user: {
      id: user.id,
      isAdmin: user.isAdmin,
      mustAddPhone: user.mustAddPhone
    },
  };
};


// =============================================================================
// 3. SEND OTP
// =============================================================================
/**
 * Generates a 6-digit OTP, upserts it in the Otp collection (so resends
 * overwrite the previous code), and emails it to the user.
 *
 * @param {string} email
 * @returns {Promise<{ msg: string }>}
 */
exports.sendOtp = async (email) => {
  if (!email) throw new Error('Email is required.');

  // Block re-registration for existing accounts
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email is already registered. Please login.');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Upsert — overwrite any previous OTP for this email
  await Otp.findOneAndUpdate(
    { email },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true }
  );

  await sendEmail({
    to:      email,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Your Verification Code</h2>
        <h1>${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
      </div>
    `,
  });

  return { msg: 'Verification code sent successfully' };
};


// =============================================================================
// 4. CHECK EMAIL AVAILABILITY
// =============================================================================
/**
 * Returns whether the given email address is available for registration.
 *
 * @param {string} email
 * @returns {Promise<{ available: boolean }>}
 */
exports.checkEmail = async (email) => {
  if (!email) throw new Error('Email is required.');

  const user = await User.findOne({ email });
  return { available: !user };
};


// =============================================================================
// 5. FORGOT PASSWORD
// =============================================================================
/**
 * Generates a secure reset token, stores its SHA-256 hash on the user doc
 * with a 15-minute expiry, and emails the raw token as a reset link.
 *
 * Always returns a generic success message regardless of whether the email
 * exists — this prevents user enumeration attacks.
 *
 * @param {string} email
 * @returns {Promise<{ msg: string }>}
 */
exports.forgotPassword = async (email) => {
  if (!email) throw new Error('Email is required.');

  const user = await User.findOne({ email });

  // Return the same message whether the user exists or not (security best practice)
  if (!user) {
    return { msg: 'If a user with that email exists, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store the hashed version — never the raw token
  user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl  = `${clientUrl}/reset-password/${resetToken}`;

  await sendEmail({
    to:      user.email,
    subject: 'Password Reset Request',
    html: `
      <h3>Password Reset</h3>
      <p>Click below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  });

  return { msg: 'If a user with that email exists, a reset link has been sent.' };
};


// =============================================================================
// 6. RESET PASSWORD
// =============================================================================
/**
 * Validates the SHA-256-hashed reset token from the URL, checks it hasn't
 * expired, hashes the new password, saves it, and clears the token fields
 * so the link cannot be reused.
 *
 * @param {string} rawToken  - Plain token from the URL param
 * @param {string} password  - New plain-text password from req.body
 * @returns {Promise<{ msg: string }>}
 */
exports.resetPassword = async (rawToken, password) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Token must not be expired
  });

  if (!user) throw new Error('TOKEN_INVALID_OR_EXPIRED');

  user.password             = await bcrypt.hash(password, 10);
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  return { msg: 'Password has been reset successfully.' };
};