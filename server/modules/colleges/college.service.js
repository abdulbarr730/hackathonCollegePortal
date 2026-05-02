const College = require('./college.model');
const withTransaction = require('../../shared/utils/withTransaction');
const ApiError = require('../../core/utils/ApiError');


// ============================================================================
// REGISTER COLLEGE SERVICE (Transactional)
// ============================================================================
exports.registerCollege = async (data) => {

  return withTransaction(async (session) => {

    const {
      name,
      shortName,
      website,
      city,
      state,
      country,
      spocName,
      spocEmail,
      spocPhone,
      designation
    } = data;

    if (!name || !spocEmail)
      throw new ApiError(400, 'College name and SPOC email required');

    const existing = await College.findOne({
      $or: [
        { name },
        { spocEmail }
      ]
    }).session(session);

    if (existing)
      throw new ApiError(400, 'College already registered');

    const college = new College({
      name,
      shortName,
      website,
      city,
      state,
      country,

      spocName,
      spocEmail,
      spocPhone,
      designation,

      status: 'pending'
    });

    await college.save({ session });

    return {
      msg: 'College registration submitted',
      college
    };

  });
};


// ============================================================================
// GET PENDING COLLEGES
// ============================================================================
exports.getPendingColleges = async () => {

  const colleges = await College.find({
    status: 'pending'
  }).sort({ createdAt: -1 });

  return colleges;
};


// ============================================================================
// APPROVE COLLEGE
// ============================================================================
exports.approveCollege = async (collegeId, adminId) => {

  return withTransaction(async (session) => {

    const college = await College.findById(collegeId)
      .session(session);

    if (!college)
      throw new ApiError(404, 'College not found');

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