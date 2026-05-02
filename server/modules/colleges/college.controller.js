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


// ============================================================================
// APPROVE COLLEGE
// ============================================================================
exports.approveCollege = asyncHandler(async (req, res) => {

  const result = await collegeService.approveCollege(
    req.params.id,
    req.user?.id
  );

  res.json(result);

});