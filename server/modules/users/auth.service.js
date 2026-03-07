const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./user.model');
const Otp = require('../auth/otp.model');
const PreapprovedStudent = require('./prepprovedStudent.model');
const cloudinary = require('../../shared/services/cloudinary.service');
const withTransaction = require('../../shared/utils/withTransaction');
const { sendEmail } = require('../../shared/services/email.service');


// ============================================================================
// REGISTER SERVICE (Transactional)
// ============================================================================
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
      course
    } = data;

    if (!otp)
      throw new Error('Verification code is required.');

    // ---------------- OTP VALIDATION ----------------
    const validOtp = await Otp.findOne({ email, otp }).session(session);
    if (!validOtp)
      throw new Error('Invalid or expired verification code.');

    await Otp.deleteOne({ _id: validOtp._id }).session(session);

    // ---------------- DUPLICATE CHECK ----------------
    const existingUser = await User.findOne({
      $or: [
        { email },
        rollNumber ? { rollNumber } : null
      ].filter(Boolean)
    }).session(session);

    if (existingUser)
      throw new Error('User already exists.');

    const newUserFields = {
      name,
      email,
      gender,
      year,
      course,
      rollNumber,
      verificationMethod
    };

    // ---------------- PREAPPROVED CHECK ----------------
    if (rollNumber) {
      const preapproved = await PreapprovedStudent
        .findOne({ rollNumber })
        .session(session);

      if (preapproved)
        newUserFields.isVerified = true;
    }

    // ---------------- DOCUMENT UPLOAD ----------------
    if (verificationMethod === 'documentUpload') {
      if (!file)
        throw new Error('ID card document is required.');

      const b64 = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'app/documents'
      });

      newUserFields.documentUrl = result.secure_url;
    }

    // ---------------- PASSWORD HASH ----------------
    const user = new User(newUserFields);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save({ session });

    return {
      msg: user.isVerified
        ? 'User registered and automatically verified!'
        : 'User registered successfully! Awaiting admin approval.',
      isVerified: user.isVerified
    };
  });
};

// ============================================================================
// LOGIN SERVICE
// ============================================================================
exports.login = async (email, password) => {

  const user = await User.findOne({ email });

  if (!user)
    throw new Error('USER_NOT_FOUND');

  if (!user.isVerified)
    throw new Error('ACCOUNT_NOT_VERIFIED');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    throw new Error('INVALID_PASSWORD');

  const payload = {
    user: {
      id: user.id,
      isAdmin: user.isAdmin
    }
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '5h'
  });

  return {
    token,
    user: {
      id: user.id,
      isAdmin: user.isAdmin
    }
  };
};

// ============================================================================
// SEND OTP SERVICE
// ============================================================================
exports.sendOtp = async (email) => {

  if (!email)
    throw new Error('Email is required.');

  const existingUser = await User.findOne({ email });
  if (existingUser)
    throw new Error('Email is already registered. Please login.');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { email },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true }
  );

  await sendEmail({
    to: email,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Your Verification Code</h2>
        <h1>${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
      </div>
    `
  });

  return { msg: 'Verification code sent successfully' };
};

// ============================================================================
// CHECK EMAIL SERVICE
// ============================================================================
exports.checkEmail = async (email) => {

  if (!email)
    throw new Error('Email is required.');

  const user = await User.findOne({ email });

  return {
    available: !user
  };
};

// ============================================================================
// FORGOT PASSWORD SERVICE
// ============================================================================
exports.forgotPassword = async (email) => {

  if (!email)
    throw new Error('Email is required.');

  const user = await User.findOne({ email });

  // Always return success message (security best practice)
  if (!user)
    return {
      msg: 'If a user with that email exists, a reset link has been sent.'
    };

  const resetToken = crypto.randomBytes(32).toString('hex');

  user.passwordResetToken =
    crypto.createHash('sha256')
      .update(resetToken)
      .digest('hex');

  user.passwordResetExpires =
    Date.now() + 15 * 60 * 1000; // 15 minutes

  await user.save();

  const clientUrl =
    process.env.CLIENT_URL || 'http://localhost:3000';

  const resetUrl =
    `${clientUrl}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <h3>Password Reset</h3>
      <p>Click below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `
  });

  return {
    msg: 'If a user with that email exists, a reset link has been sent.'
  };
};