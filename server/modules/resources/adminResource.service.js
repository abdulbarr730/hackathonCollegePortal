const { isSuperAdmin } = require('../../core/utils/roleHelper');
const Resource = require('./resource.model');
const User = require('../users/user.model');
const getSupabase = require('../../shared/services/supabase.service');

exports.listResources = async (query = {}, requester = null) => {
  const {
    status = '',
    q = '',
    category = '',
    page = '1',
    limit = '20',
    sort = '-createdAt',
  } = query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filters = {};
  if (status) filters.status = status;
  if (category && category !== 'All') filters.category = category;

  if (q) {
    filters.$or = [
      { title: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { url: new RegExp(q, 'i') },
    ];
  }

  let userCollegeId = null;
  if (requester && !isSuperAdmin(requester) && requester.college) {
    userCollegeId = requester.college._id || requester.college;
    filters.college = userCollegeId;
  } else if (query.collegeId && query.collegeId !== 'all') {
    filters.college = query.collegeId;
  }

  const [items, total, totalAllApproved, totalCollegeApproved, totalPending] = await Promise.all([
    Resource.find(filters)
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate('addedBy', 'name email role')
      .populate('approvedBy', 'name email')
      .populate('college', 'name shortName'),
    Resource.countDocuments(filters),
    Resource.countDocuments({ status: 'approved' }),
    userCollegeId ? Resource.countDocuments({ status: 'approved', college: userCollegeId }) : Resource.countDocuments({ status: 'approved' }),
    userCollegeId ? Resource.countDocuments({ status: 'pending', college: userCollegeId }) : Resource.countDocuments({ status: 'pending' })
  ]);

  return {
    items,
    counts: {
      allApproved: totalAllApproved,
      collegeApproved: totalCollegeApproved,
      otherInstitutionsApproved: Math.max(0, totalAllApproved - totalCollegeApproved),
      pending: totalPending
    },
    pagination: {
      page: pageNum,
      pages: Math.max(Math.ceil(total / perPage), 1),
      total,
      limit: perPage,
    },
  };
};

exports.approveResource = async (id, userId, requester = null) => {
  const existing = await Resource.findById(id);
  if (!existing) throw new Error('Resource not found');

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to approve resources from another college.');
      err.status = 403;
      throw err;
    }
  }

  const doc = await Resource.findByIdAndUpdate(
    id,
    {
      status: 'approved',
      rejectionReason: '',
      approvedBy: userId || undefined,
    },
    { new: true }
  ).populate('college', 'name shortName').populate('addedBy', 'name email role');

  return doc;
};

exports.rejectResource = async (id, reason = '', requester = null) => {
  const existing = await Resource.findById(id);
  if (!existing) throw new Error('Resource not found');

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to reject resources from another college.');
      err.status = 403;
      throw err;
    }
  }

  const doc = await Resource.findByIdAndUpdate(
    id,
    { status: 'rejected', rejectionReason: reason },
    { new: true }
  );

  return doc;
};

exports.deleteResource = async (id, requester = null) => {
  const existing = await Resource.findById(id);
  if (!existing) throw new Error('Resource not found');

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to delete resources from another college.');
      err.status = 403;
      throw err;
    }
  }

  if (existing.file?.key) {
    try {
      const supabase = getSupabase();
      await supabase.storage.from('resources').remove([existing.file.key]);
    } catch (e) {
      console.error('Failed to delete file from Supabase storage:', e.message);
    }
  }

  await Resource.findByIdAndDelete(id);
  return { msg: 'Deleted successfully' };
};

exports.updateResource = async (id, body, requester = null) => {
  const existing = await Resource.findById(id);
  if (!existing) throw new Error('Resource not found');

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to edit resources from another college.');
      err.status = 403;
      throw err;
    }
  }

  const { title, description, category, url, visibility, college } = body;
  const updates = {};
  if (title) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (category) updates.category = category.trim();
  if (url) updates.url = url.trim();
  if (visibility) updates.visibility = visibility;
  if (isSuperAdmin(requester) && college !== undefined) {
    updates.college = college && college !== 'all' ? college : null;
  }

  const doc = await Resource.findByIdAndUpdate(id, { $set: updates }, { new: true })
    .populate('college', 'name shortName')
    .populate('addedBy', 'name email role');

  return doc;
};
