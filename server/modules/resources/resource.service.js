const User = require('../users/user.model');
const Resource = require('./resource.model');
const getSupabase = require('../../shared/services/supabase.service');

exports.createUrlResource = async (body, userId) => {
  const { title, url, description, category, visibility = 'private' } = body;

  if (!title || !category || !url) {
    const err = new Error('Title, category, and URL are required');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId).select('college role isAdmin');
  const isPrivileged = user?.isAdmin || ['admin', 'super_admin', 'spoc', 'college_admin'].includes(user?.role);

  const doc = await Resource.create({
    title,
    description: description || '',
    category,
    url,
    visibility: visibility === 'public' ? 'public' : 'private',
    status: isPrivileged ? 'approved' : 'pending',
    addedBy: userId,
    approvedBy: isPrivileged ? userId : undefined,
    college: user?.college || null,
  });

  return doc;
};

exports.createFileResource = async (body, file, userId) => {
  if (!file) {
    const err = new Error('File is required');
    err.status = 400;
    throw err;
  }

  const { title, category, description, visibility = 'private' } = body;

  if (!title || !category) {
    const err = new Error('Title and category are required');
    err.status = 400;
    throw err;
  }

  try {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const filePath  = `uploads/${Date.now()}_${cleanName}`;
    const supabase = getSupabase();

    const { data, error } = await supabase.storage
      .from('resources')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      const err = new Error(error.message || 'Upload failed');
      err.status = 500;
      throw err;
    }

    const { data: publicData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    const user = await User.findById(userId).select('college role isAdmin');
    const isPrivileged = user?.isAdmin || ['admin', 'super_admin', 'spoc', 'college_admin'].includes(user?.role);

    const resource = await Resource.create({
      title,
      category,
      description: description || '',
      visibility: visibility === 'public' ? 'public' : 'private',
      status: isPrivileged ? 'approved' : 'pending',
      addedBy: userId,
      approvedBy: isPrivileged ? userId : undefined,
      college: user?.college || null,
      file: {
        key:          filePath,
        url:          publicData.publicUrl,
        downloadUrl:  `${publicData.publicUrl}?download=${encodeURIComponent(file.originalname)}`,
        originalName: file.originalname,
        mimeType:     file.mimetype,
        size:         file.size,
      },
    });

    return resource;
  } catch (err) {
    throw err;
  }
};

exports.listApprovedResources = async (query = {}, requester = null) => {
  const { category, q, page = '1', limit = '20', collegeId } = query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filters = { status: 'approved' };

  if (category && category !== 'All') filters.category = category;
  if (q) {
    filters.$or = [
      { title: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
    ];
  }

  // Multi-tenancy visibility logic:
  // Show all public resources, PLUS private resources from the user's college
  const userCollegeId = requester?.college?._id || requester?.college || (collegeId && collegeId !== 'all' ? collegeId : null);

  if (userCollegeId) {
    filters.$and = [
      {
        $or: [
          { visibility: 'public' },
          { visibility: 'private', college: userCollegeId }
        ]
      }
    ];
  } else {
    filters.visibility = 'public';
  }

  const [items, total] = await Promise.all([
    Resource.find(filters)
      .sort('-createdAt')
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate('addedBy', 'name email role')
      .populate('college', 'name shortName'),
    Resource.countDocuments(filters),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      pages: Math.max(Math.ceil(total / perPage), 1),
      total,
      limit: perPage,
    },
  };
};

exports.getResourceById = async (id) => {
  const doc = await Resource.findById(id)
    .populate('addedBy', 'name email role')
    .populate('college', 'name shortName');
  if (!doc) {
    const err = new Error('Resource not found');
    err.status = 404;
    throw err;
  }
  return doc;
};
