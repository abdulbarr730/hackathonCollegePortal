const collegeService = require('./college.service');
const asyncHandler = require('../../core/utils/asyncHandler');


// ============================================================================
// REGISTER COLLEGE
// ============================================================================
exports.registerCollege = asyncHandler(async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const result = await collegeService.registerCollege({
    ...req.body,
    acceptedIp: String(clientIp).split(',')[0].trim()
  });

  res.status(201).json(result);
});


// ============================================================================
// GET PENDING COLLEGES
// ============================================================================
exports.getPendingColleges = asyncHandler(async (req, res) => {
  const result = await collegeService.getPendingColleges();
  res.json(result);
});

exports.listColleges = asyncHandler(async (req, res) => {
  const result = await collegeService.listColleges(req.query, req.user);
  res.json({ items: result });
});


// ============================================================================
// APPROVE COLLEGE
// ============================================================================
exports.approveCollege = asyncHandler(async (req, res) => {
  const result = await collegeService.approveCollege(
    req.params.id,
    req.user?.id,
    { 
      adminPassword: req.body?.adminPassword || req.body?.password,
      role: req.body?.role || 'spoc',
      sendEmail: req.body?.sendEmail !== false,
      clientUrl: req.body?.clientUrl
    }
  );

  res.json(result);
});

// ============================================================================
// REJECT COLLEGE
// ============================================================================
exports.rejectCollege = asyncHandler(async (req, res) => {
  const result = await collegeService.rejectCollege(
    req.params.id,
    req.body?.reason
  );

  res.json(result);
});

exports.listPublicColleges = asyncHandler(async (_req, res) => {
  const result = await collegeService.listPublicColleges();
  res.json({ items: result });
});

exports.searchGlobalUsers = asyncHandler(async (req, res) => {
  const result = await collegeService.searchGlobalUsers(req.query.q);
  res.json({ items: result });
});

exports.inviteStaffOtp = asyncHandler(async (req, res) => {
  const result = await collegeService.inviteCollegeStaffOtp({
    collegeId: req.params.id,
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    phone: req.body.phone,
    requester: req.user
  });
  res.status(200).json(result);
});

exports.verifyStaffOtp = asyncHandler(async (req, res) => {
  const result = await collegeService.verifyCollegeStaffOtp({
    collegeId: req.params.id,
    email: req.body.email,
    otp: req.body.otp,
    password: req.body.password,
    requester: req.user
  });
  res.status(200).json(result);
});

exports.updateCollegeStaff = asyncHandler(async (req, res) => {
  const result = await collegeService.updateCollegeStaff({
    collegeId: req.params.id,
    userId: req.params.userId,
    data: req.body,
    requester: req.user
  });
  res.json(result);
});

exports.deleteCollegeStaff = asyncHandler(async (req, res) => {
  const result = await collegeService.deleteCollegeStaff({
    collegeId: req.params.id,
    userId: req.params.userId,
    requester: req.user
  });
  res.json(result);
});

exports.updateCollegeSettings = asyncHandler(async (req, res) => {
  const result = await collegeService.updateCollegeSettings({
    collegeId: req.params.id,
    data: req.body,
    requester: req.user
  });
  res.json(result);
});

exports.requestCollegeOnboarding = asyncHandler(async (req, res) => {
  const result = await collegeService.requestCollegeOnboarding(req.body);
  res.status(201).json(result);
});
