const Resource = require('./resource.model');
const supabase = require('../../shared/services/supabase.service');
const BUCKET = 'resources';

/* ============================================================================
   LIST RESOURCES (filters + pagination)
============================================================================ */
exports.listResources = async (query) => {

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
  if (category) filters.category = category;

  if (q) {
    filters.$or = [
      { title: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { url: new RegExp(q, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Resource.find(filters)
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate('addedBy', 'name email')
      .populate('approvedBy', 'name email'),
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

/* ============================================================================
   APPROVE RESOURCE
============================================================================ */
exports.approveResource = async (id, userId) => {

  const doc = await Resource.findByIdAndUpdate(
    id,
    {
      status: 'approved',
      rejectionReason: '',
      approvedBy: userId || undefined,
    },
    { new: true }
  );

  if (!doc) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  return doc;
};


/* ============================================================================
   REJECT RESOURCE
============================================================================ */
exports.rejectResource = async (id, reason = '') => {

  const doc = await Resource.findByIdAndUpdate(
    id,
    {
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: undefined,
    },
    { new: true }
  );

  if (!doc) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  return doc;
};

/* ============================================================================
   UPDATE RESOURCE (title / description only)
============================================================================ */
exports.updateResource = async (id, body) => {

  const { title, description } = body || {};
  const updates = {};

  if (typeof title === 'string') updates.title = title;
  if (typeof description === 'string') updates.description = description;

  const doc = await Resource.findByIdAndUpdate(id, updates, { new: true });

  if (!doc) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  return doc;
};

/* ============================================================================
   DELETE RESOURCE (DB + storage)
============================================================================ */
exports.deleteResource = async (id) => {

  const doc = await Resource.findByIdAndDelete(id);

  if (!doc) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  try {
    const path = doc?.file?.path;
    if (path) {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) console.error('Supabase single delete error:', error.message || error);
    }
  } catch (e) {
    console.error('Supabase delete exception:', e);
  }

  return true;
};

/* ============================================================================
   BULK DELETE (DB + storage)
============================================================================ */
exports.bulkDeleteResources = async (ids = []) => {

  if (!Array.isArray(ids) || ids.length === 0) {
    const err = new Error('Invalid IDs');
    err.status = 400;
    throw err;
  }

  const resources = await Resource.find(
    { _id: { $in: ids } },
    { file: 1 }
  ).lean();

  const paths = resources
    .map(r => r?.file?.path)
    .filter(Boolean);

  // delete DB
  const dbResult = await Resource.deleteMany({ _id: { $in: ids } });

  // delete storage (best effort)
  if (paths.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) {
      console.error('Supabase bulk delete error:', error.message || error);
    }
  }

  return {
    requested: ids.length,
    deleted: dbResult?.deletedCount || 0,
    filesAttempted: paths.length,
  };
};

/* ============================================================================
   GET VIEW URL
============================================================================ */
exports.getViewUrl = async (id) => {
  const resource = await Resource.findById(id).lean();

  if (!resource || !resource.file?.url) {
    const err = new Error('File or view URL not found.');
    err.status = 404;
    throw err;
  }

  return resource.file.url;
};


/* ============================================================================
   GET DOWNLOAD URL
============================================================================ */
exports.getDownloadUrl = async (id) => {
  const resource = await Resource.findById(id).lean();

  if (!resource || !resource.file?.downloadUrl) {
    const err = new Error('File or download URL not found.');
    err.status = 404;
    throw err;
  }

  return resource.file.downloadUrl;
};

/* ============================================================================
   GET COUNTS BY STATUS
============================================================================ */
exports.getCounts = async () => {

  const counts = await Resource.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const result = { pending: 0, approved: 0, rejected: 0 };

  counts.forEach(c => {
    if (c._id && Object.prototype.hasOwnProperty.call(result, c._id)) {
      result[c._id] = c.count;
    }
  });

  return result;
};