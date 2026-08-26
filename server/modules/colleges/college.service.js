const discordService = require('../../shared/services/discord.service');
const bcrypt = require('bcryptjs');
const College = require('./college.model');
const User = require('../users/user.model');
const Otp = require('../auth/otp.model');
const withTransaction = require('../../shared/utils/withTransaction');
const ApiError = require('../../core/utils/ApiError');
const { isSuperAdmin } = require('../../core/utils/roleHelper');
const { sendMail } = require('../../shared/services/email.service');

const createCollegeAdmin = async (college, password, session, role = 'spoc') => {
  if (!password || password.length < 6) {
    throw new ApiError(400, 'Admin password must be at least 6 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await User.findOne({ email: college.spocEmail }).session(session);

  if (existingUser) {
    existingUser.password = hashedPassword;
    existingUser.role = role;
    existingUser.isAdmin = true;
    existingUser.isVerified = true;
    existingUser.mustChangePassword = true;
    existingUser.college = college._id;
    existingUser.adminNotes = 'College staff account provisioned during onboarding.';
    await existingUser.save({ session });
    return existingUser;
  }

  const [adminUser] = await User.create([{
    name: college.spocName,
    email: college.spocEmail,
    password: hashedPassword,
    phone: college.spocPhone || '',
    gender: 'Other',
    course: 'B.Tech',
    year: 1,
    role: role,
    isAdmin: true,
    isVerified: true,
    mustChangePassword: true,
    verificationMethod: 'documentUpload',
    college: college._id,
    adminNotes: 'College staff account provisioned during onboarding.'
  }], { session });

  return adminUser;
};

exports.registerCollege = async (data) => {
  return withTransaction(async (session) => {
    const {
      name,
      shortName,
      website,
      domain,
      hasCustomDomain,
      allowGenericEmails,
      allowedDomains,
      city,
      state,
      country,
      aisheCode,
      institutionType,
      affiliatedUniversity,
      address,
      pincode,
      spocName,
      spocEmail,
      spocPhone,
      spocAlternatePhone,
      designation,
      department,
      estimatedStudents,
      institutionalAgreementSignedBy,
      termsAccepted,
      acceptedIp,
      adminPassword
    } = data;

    if (!name || !spocName || !spocEmail) {
      throw new ApiError(400, 'College name, SPOC name, and SPOC email are required');
    }

    const existing = await College.findOne({
      $or: [
        { name },
        { spocEmail: String(spocEmail).toLowerCase() }
      ]
    }).session(session);

    if (existing) throw new ApiError(400, 'College already registered');

    const college = new College({
      name,
      shortName,
      website,
      domain: domain ? domain.trim() : '',
      hasCustomDomain: !!hasCustomDomain,
      allowGenericEmails: typeof allowGenericEmails !== 'undefined' ? !!allowGenericEmails : !hasCustomDomain,
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : (domain ? [domain.trim().toLowerCase()] : []),
      city,
      state,
      country: country || 'India',
      aisheCode,
      institutionType: institutionType || 'Autonomous / Affiliated',
      affiliatedUniversity,
      address,
      pincode,
      spocName,
      spocEmail: String(spocEmail).toLowerCase(),
      spocPhone,
      spocAlternatePhone,
      designation,
      department,
      estimatedStudents: estimatedStudents || '500-1500',
      termsAccepted: termsAccepted !== false,
      termsAcceptedAt: new Date(),
      collegeAgreementAcceptedAt: new Date(),
      institutionalAgreementSignedBy: institutionalAgreementSignedBy || spocName,
      acceptedIp: acceptedIp || '',
      status: 'pending',
      staff: [{
        name: spocName,
        email: String(spocEmail).toLowerCase().trim(),
        role: 'spoc',
        phone: spocPhone || '',
        isVerified: true,
        verifiedAt: new Date()
      }]
    });

    await college.save({ session });

    // Non-blocking Discord Notification
    discordService.notifyCollegeOnboarding(data).catch(() => {});

    if (adminPassword) {
      const adminUser = await createCollegeAdmin(college, adminPassword, session);
      college.adminUser = adminUser._id;
      if (college.staff && college.staff[0]) {
        college.staff[0].user = adminUser._id;
      }
      await college.save({ session });
    }

    return {
      msg: 'College registration submitted successfully',
      college
    };
  });
};

exports.listColleges = async (query = {}, requester = null) => {
  const { q = '', status = 'all' } = query;
  const filter = {};

  if (requester && !isSuperAdmin(requester) && requester.college) {
    filter._id = requester.college;
  }

  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { shortName: new RegExp(q, 'i') },
      { spocEmail: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
      { state: new RegExp(q, 'i') },
      { domain: new RegExp(q, 'i') }
    ];
  }

  if (['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }

  return College.find(filter)
    .populate('adminUser', 'name email role isAdmin mustChangePassword')
    .populate('staff.user', 'name email role isVerified phone')
    .sort({ createdAt: -1 });
};

exports.listPublicColleges = async () => {
  return College.find({ status: 'approved', isActive: true })
    .select('_id name shortName website domain hasCustomDomain allowGenericEmails city state logoUrl')
    .sort({ name: 1 })
    .lean();
};

exports.getPendingColleges = async () => {
  return College.find({ status: 'pending' }).sort({ createdAt: -1 });
};

exports.approveCollege = async (collegeId, adminId, options = {}) => {
  return withTransaction(async (session) => {
    const college = await College.findById(collegeId).session(session);
    if (!college) throw new ApiError(404, 'College not found');

    const role = options.role || 'spoc';
    const initialPassword = options.adminPassword || options.password || `${(college.shortName || 'CampX').toUpperCase()}@${Math.floor(1000 + Math.random() * 9000)}`;

    const adminUser = await createCollegeAdmin(college, initialPassword, session, role);
    college.adminUser = adminUser._id;
    if (college.staff && college.staff.length > 0) {
      college.staff[0].user = adminUser._id;
      college.staff[0].role = role;
      college.staff[0].isVerified = true;
      college.staff[0].verifiedAt = new Date();
    } else {
      college.staff = [{
        user: adminUser._id,
        name: college.spocName,
        email: college.spocEmail,
        role: role,
        phone: college.spocPhone || '',
        isVerified: true,
        verifiedAt: new Date()
      }];
    }

    college.status = 'approved';
    college.isActive = true;
    college.approvedBy = adminId;
    college.approvedAt = new Date();

    await college.save({ session });

    // Send credentials email to SPOC if requested
    if (options.sendEmail !== false) {
      const { getFrontendUrl } = require('../../core/utils/urlHelper');
      const baseUrl = getFrontendUrl(null, options.clientUrl);
      const loginUrl = `${baseUrl}/login`;

      try {
        await sendMail({
          to: college.spocEmail,
          subject: `Official SPOC Credentials & Institutional Approval - ${college.shortName || college.name}`,
          html: `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; }
              .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
              .badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; border: 1px solid #d1fae5; }
              h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; }
              p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
              .cred-box { background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 24px 0; }
              .cred-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
              .cred-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
              .cred-label { color: #64748b; font-weight: 600; }
              .cred-val { color: #0f172a; font-weight: 700; font-family: monospace; }
              .btn-wrap { text-align: center; margin: 28px 0; }
              .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 12px; }
              .footer { font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 18px; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="badge">✓ Institution Approved</div>
              <h1>Welcome to CampXCode Portal</h1>
              <p>Dear <strong>${college.spocName}</strong>,</p>
              <p>Your institutional onboarding application for <strong>${college.name}</strong> has been approved by the Super Administrator. Your SPOC administrative dashboard access has been provisioned.</p>
              
              <div class="cred-box">
                <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #4f46e5; margin-bottom: 14px;">Your SPOC Login Credentials</div>
                <div class="cred-row"><span class="cred-label">Portal URL:</span> <span class="cred-val">${baseUrl}</span></div>
                <div class="cred-row"><span class="cred-label">Login Email:</span> <span class="cred-val">${college.spocEmail}</span></div>
                <div class="cred-row"><span class="cred-label">Initial Password:</span> <span class="cred-val">${initialPassword}</span></div>
                <div class="cred-row"><span class="cred-label">Assigned Role:</span> <span class="cred-val">${role.toUpperCase()}</span></div>
              </div>

              <div class="btn-wrap">
                <a href="${loginUrl}" class="btn" target="_blank">Log In to SPOC Portal &rarr;</a>
              </div>

              <p style="font-size: 12px; color: #64748b;">
                For security, please change your password after your first login via profile settings.
              </p>

              <div class="footer">
                Official institutional communication from CampXCode Portal.<br/>
                &copy; ${new Date().getFullYear()} Campus Hackathon Portal. All rights reserved.
              </div>
            </div>
          </body>
          </html>`,
          text: `Your college ${college.name} has been approved.\nLogin at: ${loginUrl}\nEmail: ${college.spocEmail}\nPassword: ${initialPassword}`
        });
      } catch (err) {
        console.error('Failed to dispatch SPOC approval email:', err.message);
      }
    }

    return {
      msg: 'College approved successfully and credentials provisioned for SPOC.',
      college,
      initialPassword
    };
  });
};

exports.rejectCollege = async (collegeId, reason) => {
  const college = await College.findByIdAndUpdate(
    collegeId,
    {
      status: 'rejected',
      isActive: false,
      rejectedReason: reason || 'Rejected by admin'
    },
    { new: true }
  );

  if (!college) throw new ApiError(404, 'College not found');

  return {
    msg: 'College rejected',
    college
  };
};

/* ================= WORLDWIDE USER SEARCH ================= */
exports.searchGlobalUsers = async (query = '') => {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();

  const users = await User.find({
    $or: [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { rollNumber: new RegExp(q, 'i') }
    ]
  })
    .select('name email role phone rollNumber college isVerified')
    .populate('college', 'name shortName')
    .limit(20)
    .lean();

  return users;
};

/* ================= STAFF OTP INVITATION & APPOINTMENT ================= */
exports.inviteCollegeStaffOtp = async ({ collegeId, name, email, role, phone, requester }) => {
  if (!email || !name) {
    throw new ApiError(400, 'Name and email are required');
  }

  const college = await College.findById(collegeId);
  if (!college) throw new ApiError(404, 'College not found');

  if (requester && !isSuperAdmin(requester) && String(requester.college) !== String(collegeId)) {
    throw new ApiError(403, 'Unauthorized to manage staff for another college');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const staffRole = ['spoc', 'college_admin', 'admin', 'judge'].includes(role) ? role : 'spoc';

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { email: normalizedEmail },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true }
  );

  // Check if staff entry already exists in college
  const existingStaffIndex = college.staff.findIndex(s => s.email === normalizedEmail);
  if (existingStaffIndex >= 0) {
    college.staff[existingStaffIndex].name = name;
    college.staff[existingStaffIndex].role = staffRole;
    if (phone) college.staff[existingStaffIndex].phone = phone;
  } else {
    college.staff.push({
      name,
      email: normalizedEmail,
      role: staffRole,
      phone: phone || '',
      isVerified: false,
      invitedAt: new Date()
    });
  }
  await college.save();

  // Dispatch Email via Resend
  await sendMail({
    to: normalizedEmail,
    subject: `Official Staff Appointment Verification Code - ${college.shortName || college.name}`,
    html: `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f8f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;padding:40px 16px;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e4e4ed;overflow:hidden;">
              <tr>
                <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
                  <div style="color:#fff;font-size:22px;font-weight:700;margin:0;">Institutional Staff Verification</div>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;text-align:center;">
                  <p style="color:#4a4a6a;font-size:15px;margin:0 0 20px;">
                    Hi <strong>${name}</strong>, you have been appointed as <strong>${staffRole.toUpperCase()}</strong> for <strong>${college.name}</strong> on CampXCode Portal.
                  </p>
                  <div style="background:#f4f4ff;border:2px dashed #4f46e5;border-radius:12px;padding:20px;display:inline-block;margin-bottom:20px;">
                    <div style="color:#4f46e5;font-size:36px;font-weight:800;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</div>
                  </div>
                  <p style="color:#71717a;font-size:13px;margin:0;">
                    Please provide this 6-digit verification code to confirm your institutional staff appointment. Valid for 10 minutes.
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
    msg: 'Verification OTP sent to staff email',
    email: normalizedEmail,
    role: staffRole
  };
};

/* ================= VERIFY STAFF OTP & ACTIVATE ================= */
exports.verifyCollegeStaffOtp = async ({ collegeId, email, otp, password, requester }) => {
  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP code are required');
  }

  const college = await College.findById(collegeId);
  if (!college) throw new ApiError(404, 'College not found');

  if (requester && !isSuperAdmin(requester) && String(requester.college) !== String(collegeId)) {
    throw new ApiError(403, 'Unauthorized to verify staff for another college');
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const validOtp = await Otp.findOne({ email: normalizedEmail, otp });
  if (!validOtp) {
    throw new ApiError(400, 'Invalid or expired OTP verification code');
  }

  await Otp.deleteOne({ _id: validOtp._id });

  // Locate staff entry
  const staffEntry = college.staff.find(s => s.email === normalizedEmail) || {
    name: normalizedEmail.split('@')[0],
    role: 'spoc',
    phone: ''
  };

  const staffRole = staffEntry.role || 'spoc';

  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    user.role = staffRole;
    user.isAdmin = true;
    user.isVerified = true;
    user.college = collegeId;
    if (password && password.length >= 6) {
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = false;
    }
    await user.save();
  } else {
    const hashedPassword = await bcrypt.hash(password || 'Staff@1234', 10);
    user = await User.create({
      name: staffEntry.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: staffRole,
      isAdmin: true,
      isVerified: true,
      mustChangePassword: !password,
      college: collegeId,
      phone: staffEntry.phone || '',
      gender: 'Other',
      course: 'Faculty / Staff',
      year: 1,
      verificationMethod: 'rollNumber'
    });
  }

  // Update staff in college model
  const staffIndex = college.staff.findIndex(s => s.email === normalizedEmail);
  if (staffIndex >= 0) {
    college.staff[staffIndex].user = user._id;
    college.staff[staffIndex].isVerified = true;
    college.staff[staffIndex].verifiedAt = new Date();
  } else {
    college.staff.push({
      user: user._id,
      name: user.name,
      email: normalizedEmail,
      role: staffRole,
      phone: user.phone || '',
      isVerified: true,
      verifiedAt: new Date()
    });
  }

  if (!college.adminUser) {
    college.adminUser = user._id;
  }

  await college.save();

  return {
    msg: `${staffRole.toUpperCase()} verified and activated successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college
    },
    college
  };
};

/* ================= UPDATE COLLEGE STAFF ================= */
exports.updateCollegeStaff = async ({ collegeId, userId, data, requester }) => {
  const college = await College.findById(collegeId);
  if (!college) throw new ApiError(404, 'College not found');

  if (requester && !isSuperAdmin(requester) && String(requester.college) !== String(collegeId)) {
    throw new ApiError(403, 'Unauthorized to update staff for another college');
  }

  const { name, role, phone } = data;
  const staffRole = ['spoc', 'college_admin', 'admin', 'judge'].includes(role) ? role : undefined;

  const user = await User.findById(userId);
  if (user) {
    if (name) user.name = name;
    if (staffRole) user.role = staffRole;
    if (phone) user.phone = phone;
    await user.save();
  }

  const staffIndex = college.staff.findIndex(s => String(s.user) === String(userId) || (user && s.email === user.email));
  if (staffIndex >= 0) {
    if (name) college.staff[staffIndex].name = name;
    if (staffRole) college.staff[staffIndex].role = staffRole;
    if (phone) college.staff[staffIndex].phone = phone;
    await college.save();
  }

  return {
    msg: 'Staff member updated successfully',
    user
  };
};

/* ================= DELETE / DEMOTE COLLEGE STAFF ================= */
exports.deleteCollegeStaff = async ({ collegeId, userId, requester }) => {
  const college = await College.findById(collegeId);
  if (!college) throw new ApiError(404, 'College not found');

  if (requester && !isSuperAdmin(requester) && String(requester.college) !== String(collegeId)) {
    throw new ApiError(403, 'Unauthorized to remove staff for another college');
  }

  const user = await User.findById(userId);
  if (user) {
    // Demote to student
    user.role = 'student';
    user.isAdmin = false;
    await user.save();
  }

  college.staff = college.staff.filter(s => String(s.user) !== String(userId) && (!user || s.email !== user.email));
  if (college.adminUser && String(college.adminUser) === String(userId)) {
    college.adminUser = college.staff.find(s => s.user)?.user || undefined;
  }
  await college.save();

  return {
    msg: 'Staff member removed from college administration',
    college
  };
};

/* ================= UPDATE COLLEGE SETTINGS ================= */
exports.updateCollegeSettings = async ({ collegeId, data, requester }) => {
  const college = await College.findById(collegeId);
  if (!college) throw new ApiError(404, 'College not found');

  if (requester && !isSuperAdmin(requester) && String(requester.college) !== String(collegeId)) {
    throw new ApiError(403, 'Unauthorized to update settings for another college');
  }

  const {
    name,
    shortName,
    website,
    domain,
    hasCustomDomain,
    allowGenericEmails,
    city,
    state,
    aisheCode,
    institutionType,
    spocName,
    spocPhone
  } = data;

  if (name) college.name = name;
  if (shortName) college.shortName = shortName;
  if (typeof website !== 'undefined') college.website = website;
  if (typeof domain !== 'undefined') college.domain = domain ? domain.trim() : '';
  if (typeof hasCustomDomain !== 'undefined') college.hasCustomDomain = !!hasCustomDomain;
  if (typeof allowGenericEmails !== 'undefined') college.allowGenericEmails = !!allowGenericEmails;
  if (city) college.city = city;
  if (state) college.state = state;
  if (aisheCode) college.aisheCode = aisheCode;
  if (institutionType) college.institutionType = institutionType;
  if (spocName) college.spocName = spocName;
  if (spocPhone) college.spocPhone = spocPhone;

  await college.save();

  return {
    msg: 'College settings updated successfully',
    college
  };
};

exports.requestCollegeOnboarding = async (data) => {
  const { name, city, state, requesterName, requesterEmail, requesterPhone, notes } = data;
  if (!name || !requesterEmail) {
    throw new ApiError(400, 'College name and contact email are required');
  }

  const existing = await College.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existing) {
    return {
      msg: 'College already exists in the system',
      college: existing
    };
  }

  const college = new College({
    name,
    city: city || '',
    state: state || '',
    spocName: requesterName || 'Requested By Student',
    spocEmail: String(requesterEmail).toLowerCase().trim(),
    spocPhone: requesterPhone || '',
    notes: notes || 'Submitted through student registration unlisted college request',
    status: 'pending'
  });

  await college.save();

  return {
    msg: 'College onboarding request submitted successfully',
    college
  };
};
