const discordService = require('../../shared/services/discord.service');
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
        phone,
        college
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
      college: college || undefined,
      phone: phone || '',
      mustAddPhone: phone ? false : true,
      termsAccepted: data.termsAccepted !== false,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      acceptedIp: data.acceptedIp || '',
    };

    // ── Pre-approved student check ────────────────────────────────────────────
    // If the roll number exists in the pre-approved list (optionally matched by college), auto-verify
    if (rollNumber) {
      const preapprovedFilter = { rollNumber };
      if (college) {
        preapprovedFilter.$or = [{ college }, { college: { $exists: false } }, { college: null }];
      }
      const preapproved = await PreapprovedStudent
        .findOne(preapprovedFilter)
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
 * Verifies credentials and returns a signed JWT + full user info.
 *
 * @param {string} email
 * @param {string} password - Plain-text password from the request
 * @returns {Promise<{ token: string, user: object }>}
 */
exports.login = async (email, password) => {
  const user = await User.findOne({ email }).populate('college', 'name shortName logoUrl');

  if (!user)          throw new Error('USER_NOT_FOUND');
  if (!user.isVerified) throw new Error('ACCOUNT_NOT_VERIFIED');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('INVALID_PASSWORD');

  const payload = {
    user: {
      id: user.id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      college: user.college?._id || user.college,
      mustAddPhone: user.mustAddPhone,
      mustChangePassword: user.mustChangePassword
    },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });

  return {
    token,
    user: {
      id: user.id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      mustAddPhone: user.mustAddPhone,
      mustChangePassword: user.mustChangePassword
    },
  };
};

// =============================================================================
// 2.1 CHANGE INITIAL / FORCED PASSWORD
// =============================================================================
exports.changeInitialPassword = async ({ userId, email, currentPassword, newPassword, otp }) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  let user;
  if (userId) {
    user = await User.findById(userId).populate('college', 'name shortName logoUrl');
  } else if (email) {
    user = await User.findOne({ email: String(email).toLowerCase().trim() }).populate('college', 'name shortName logoUrl');
  }

  if (!user) throw new Error('User not found.');

  // Validate either with current temp password or OTP
  if (otp) {
    const validOtp = await Otp.findOne({ email: user.email, otp });
    if (!validOtp) throw new Error('Invalid or expired OTP verification code.');
    await Otp.deleteOne({ _id: validOtp._id });
  } else if (currentPassword) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('Current temporary password is incorrect.');
  } else {
    throw new Error('Current password or OTP is required.');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.mustChangePassword = false;
  await user.save();

    // Dispatch welcome email asynchronously
    emailService.sendWelcomeEmail({
      to: user.email,
      name: user.name,
      collegeName: user.college ? 'Your College' : 'CampXCode'
    }).catch(e => console.error('Welcome email error:', e.message));
    discordService.notifyUserSignup({
      name: user.name,
      email: user.email,
      role: user.role,
      course: user.course,
      year: user.year
    }).catch(() => {});

  const payload = {
    user: {
      id: user.id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      college: user.college?._id || user.college,
      mustAddPhone: user.mustAddPhone,
      mustChangePassword: false
    },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return {
    msg: 'Password successfully updated!',
    token,
    user: {
      id: user.id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      mustAddPhone: user.mustAddPhone,
      mustChangePassword: false
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
                  <p style="color:#c0c0d8;font-size:11px;margin:0;">© 2026 CampXCode · All rights reserved</p>
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

  // Rate Limiter: Prevent spam requests within 3 minutes of recent request
  if (user.passwordResetExpires && (user.passwordResetExpires - Date.now() > 12 * 60 * 1000)) {
    return { msg: 'A password reset link was recently sent. Please wait a few minutes before requesting another.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store the hashed version — never the raw token
  user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  await user.save();

  const { getFrontendUrl } = require('../../core/utils/urlHelper');
  const clientUrl = getFrontendUrl(null, process.env.CLIENT_URL);
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
                  <p style="color:#c0c0d8;font-size:11px;margin:0;">© 2026 CampXCode · All rights reserved</p>
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

// =============================================================================
// 7. REQUEST EMAIL CHANGE (with OTP)
// =============================================================================
exports.requestEmailChange = async ({ userId, newEmail }) => {
  if (!newEmail || !newEmail.includes('@')) {
    throw new Error('Valid email address is required.');
  }

  const normalizedEmail = newEmail.toLowerCase().trim();

  // Check if email is already used by another account
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    if (String(existing._id) === String(userId)) {
      throw new Error('This is already your current registered email address.');
    }
    throw new Error('This email address is already registered to another account.');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { email: normalizedEmail },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true }
  );

  const user = await User.findById(userId);

  await sendMail({
    to: normalizedEmail,
    subject: 'Confirm your email change verification code',
    html: `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f8f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;padding:40px 16px;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e4e4ed;overflow:hidden;">
              <tr>
                <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
                  <div style="color:#fff;font-size:22px;font-weight:700;margin:0;">Email Change Verification</div>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;text-align:center;">
                  <p style="color:#4a4a6a;font-size:15px;margin:0 0 20px;">
                    Hi <strong>\${user ? user.name : 'there'}</strong>, you requested to update your account email to <strong>\${normalizedEmail}</strong>.
                  </p>
                  <div style="background:#f4f4ff;border:2px dashed #4f46e5;border-radius:12px;padding:20px;display:inline-block;margin-bottom:20px;">
                    <div style="color:#4f46e5;font-size:36px;font-weight:800;letter-spacing:10px;font-family:'Courier New',monospace;">\${otp}</div>
                  </div>
                  <p style="color:#71717a;font-size:13px;margin:0;">
                    This code is valid for 10 minutes. If you did not make this request, please ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>`
  });

  return {
    msg: 'Verification OTP sent to your new email address.',
    email: normalizedEmail
  };
};

// =============================================================================
// 8. VERIFY EMAIL CHANGE (with OTP)
// =============================================================================
exports.verifyEmailChange = async ({ userId, newEmail, otp }) => {
  if (!newEmail || !otp) {
    throw new Error('New email address and OTP code are required.');
  }

  const normalizedEmail = newEmail.toLowerCase().trim();

  const validOtp = await Otp.findOne({ email: normalizedEmail, otp });
  if (!validOtp) {
    throw new Error('Invalid or expired verification OTP code.');
  }

  // Check again for collision
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing && String(existing._id) !== String(userId)) {
    throw new Error('This email address was claimed by another account.');
  }

  await Otp.deleteOne({ _id: validOtp._id });

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

  user.email = normalizedEmail;
  await user.save();

  // Create fresh JWT token
  const token = jwt.sign(
    { user: { id: user.id, _id: user._id, email: user.email, name: user.name, role: user.role, isAdmin: user.isAdmin, college: user.college } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    msg: 'Email address updated and verified successfully.',
    user: {
      id: user.id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified
    },
    token
  };
};