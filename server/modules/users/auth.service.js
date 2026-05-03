const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./user.model');
const Otp = require('../auth/otp.model');
const PreapprovedStudent = require('./prepprovedStudent.model');
const cloudinary = require('../../shared/services/cloudinary.service');
const withTransaction = require('../../shared/utils/withTransaction');
const { sendMail } = require('../../shared/services/email.service');

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

  await sendMail({
    to: email,
    subject: 'Your CampXCode verification code',
    html: `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f8f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;padding:40px 16px;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e4e4ed;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#9333ea);padding:36px 40px;text-align:center;">
                  <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:10px;padding:8px 20px;margin-bottom:14px;">
                    <span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:1px;">CampXCode</span>
                  </div>
                  <div style="color:#fff;font-size:22px;font-weight:700;margin:0;">Verify your email</div>
                  <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:6px;">One step away from joining the hackathon portal</div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="color:#4a4a6a;font-size:15px;margin:0 0 28px;line-height:1.7;">
                    Hey there! Use the verification code below to complete your registration. This code expires in <strong style="color:#1e1e2e;">5 minutes</strong>.
                  </p>

                  <!-- OTP Box -->
                  <div style="background:#f4f4ff;border:1.5px solid #c7c7f5;border-radius:12px;padding:32px;text-align:center;margin-bottom:28px;">
                    <div style="color:#8888aa;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Verification Code</div>
                    <div style="color:#4f46e5;font-size:48px;font-weight:700;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</div>
                    <div style="margin-top:16px;display:inline-block;background:#ededff;border-radius:20px;padding:6px 18px;">
                      <span style="color:#6366f1;font-size:12px;font-weight:600;">⏱ Valid for 5 minutes</span>
                    </div>
                  </div>

                  <p style="color:#9090aa;font-size:13px;margin:0 0 24px;line-height:1.7;">
                    If you didn't request this code, you can safely ignore this email. Someone may have entered your email by mistake.
                  </p>

                  <div style="border-top:1px solid #ebebf5;margin:24px 0;"></div>

                  <div style="text-align:center;">
                    <p style="color:#b0b0c8;font-size:12px;margin:0;line-height:1.6;">
                      Automated message from <strong style="color:#6366f1;">CampXCode</strong> · Do not reply
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8f8fb;border-top:1px solid #e4e4ed;padding:18px 40px;text-align:center;">
                  <p style="color:#c0c0d8;font-size:11px;margin:0;">© 2025 CampXCode · All rights reserved</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>`,
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

  await sendMail({
    to: user.email,
    subject: 'Reset your CampXCode password',
    html: `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f8f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;padding:40px 16px;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e4e4ed;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#9333ea);padding:36px 40px;text-align:center;">
                  <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:10px;padding:8px 20px;margin-bottom:14px;">
                    <span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:1px;">CampXCode</span>
                  </div>
                  <div style="color:#fff;font-size:22px;font-weight:700;margin:0;">Reset your password</div>
                  <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:6px;">We received a request to reset your account password</div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="color:#4a4a6a;font-size:15px;margin:0 0 6px;line-height:1.7;">
                    Hi <strong style="color:#1e1e2e;">${user.name}</strong>,
                  </p>
                  <p style="color:#4a4a6a;font-size:15px;margin:0 0 28px;line-height:1.7;">
                    Click the button below to reset your password. This link is valid for <strong style="color:#1e1e2e;">15 minutes</strong> and can only be used once.
                  </p>

                  <!-- CTA -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#9333ea);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Reset my password →
                    </a>
                  </div>

                  <!-- Link fallback -->
                  <div style="background:#f4f4ff;border:1px solid #ddddf5;border-radius:10px;padding:16px;margin-bottom:24px;">
                    <p style="color:#9090aa;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Or copy this link</p>
                    <p style="color:#6366f1;font-size:12px;margin:0;word-break:break-all;font-family:'Courier New',monospace;">${resetUrl}</p>
                  </div>

                  <!-- Warning -->
                  <div style="background:#fff8f8;border:1px solid #fcd5d5;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
                    <p style="color:#e05555;font-size:13px;margin:0;line-height:1.6;">
                      ⚠️ If you didn't request a password reset, ignore this email. Your password will not change.
                    </p>
                  </div>

                  <div style="border-top:1px solid #ebebf5;margin:24px 0;"></div>

                  <div style="text-align:center;">
                    <p style="color:#b0b0c8;font-size:12px;margin:0;line-height:1.6;">
                      Automated message from <strong style="color:#6366f1;">CampXCode</strong> · Do not reply
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8f8fb;border-top:1px solid #e4e4ed;padding:18px 40px;text-align:center;">
                  <p style="color:#c0c0d8;font-size:11px;margin:0;">© 2025 CampXCode · All rights reserved</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>`,
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