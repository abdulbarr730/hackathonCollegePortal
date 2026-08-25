const collegeService = require('./college.service');
const asyncHandler = require('../../core/utils/asyncHandler');


// ============================================================================
// REGISTER COLLEGE
// ============================================================================
exports.registerCollege = asyncHandler(async (req, res) => {

  const result = await collegeService.registerCollege(req.body);

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

  const result = await collegeService.listColleges(req.query);

  res.json({ items: result });

});


// ============================================================================
// APPROVE COLLEGE
// ============================================================================
exports.approveCollege = asyncHandler(async (req, res) => {

  const result = await collegeService.approveCollege(
    req.params.id,
    req.user?.id,
    { adminPassword: req.body?.adminPassword }
  );

  res.json(result);

});

exports.listPublicColleges = asyncHandler(async (_req, res) => {
  const result = await collegeService.listPublicColleges();
  res.json({ items: result });
});

exports.addCollegeStaff = asyncHandler(async (req, res) => {
  const result = await collegeService.addCollegeStaff({
    collegeId: req.params.id || req.body.collegeId,
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    phone: req.body.phone,
    password: req.body.password,
    requester: req.user
  });
  res.status(201).json(result);
});

exports.requestCollegeOnboarding = asyncHandler(async (req, res) => {
  const result = await collegeService.requestCollegeOnboarding(req.body);
  res.status(201).json(result);
});

