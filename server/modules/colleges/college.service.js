const bcrypt = require('bcryptjs');
const College = require('./college.model');
const User = require('../users/user.model');
const withTransaction = require('../../shared/utils/withTransaction');
const ApiError = require('../../core/utils/ApiError');

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
      city,
      state,
      country,
      spocName,
      spocEmail,
      spocPhone,
      designation,
      department,
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
      domain,
      city,
      state,
      country,
      spocName,
      spocEmail,
      spocPhone,
      designation,
      department,
      status: 'pending'
    });

    await college.save({ session });

    if (adminPassword) {
      const adminUser = await createCollegeAdmin(college, adminPassword, session);
      college.adminUser = adminUser._id;
      await college.save({ session });
    }

    return {
      msg: 'College registration submitted',
      college
    };
  });
};

exports.listColleges = async (query = {}) => {
  const { q = '', status = 'all' } = query;
  const filter = {};

  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { shortName: new RegExp(q, 'i') },
      { spocEmail: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
      { state: new RegExp(q, 'i') }
    ];
  }

  if (['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }

  return College.find(filter)
    .populate('adminUser', 'name email role isAdmin mustChangePassword')
    .sort({ createdAt: -1 });
};

exports.listPublicColleges = async () => {
  return College.find({ status: 'approved', isActive: true })
    .select('_id name shortName website domain city state logoUrl')
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

    if (options.adminPassword) {
      const adminUser = await createCollegeAdmin(college, options.adminPassword, session);
      college.adminUser = adminUser._id;
    }

    college.status = 'approved';
    college.isActive = true;
    college.approvedBy = adminId;
    college.approvedAt = new Date();

    await college.save({ session });

    return {
      msg: 'College approved successfully',
      college
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

exports.addCollegeStaff = async ({ collegeId, name, email, role, phone, password, requester }) => {
  if (!email || !name || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  const college = await College.findById(collegeId);
  if (!college) throw new ApiError(404, 'College not found');

  // Permission check: if requester has a college assigned, it must match this college
  if (requester.college && String(requester.college) !== String(collegeId) && requester.role !== 'admin') {
    throw new ApiError(403, 'Unauthorized to add staff for another college');
  }

  const staffRole = ['spoc', 'college_admin', 'admin'].includes(role) ? role : 'spoc';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (user) {
    user.name = name;
    user.role = staffRole;
    user.isAdmin = true;
    user.isVerified = true;
    user.mustChangePassword = true;
    user.password = hashedPassword;
    user.college = collegeId;
    if (phone) user.phone = phone;
    await user.save();
  } else {
    user = await User.create({
      name,
      email: String(email).toLowerCase().trim(),
      password: hashedPassword,
      role: staffRole,
      isAdmin: true,
      isVerified: true,
      mustChangePassword: true,
      college: collegeId,
      phone: phone || '',
      gender: 'Other',
      course: 'B.Tech',
      year: 1,
      verificationMethod: 'rollNumber'
    });
  }

  return {
    msg: `College ${staffRole.toUpperCase()} provisioned successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      mustChangePassword: user.mustChangePassword
    }
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

