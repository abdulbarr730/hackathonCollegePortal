const Resource = require('./resource.model');
const getSupabase = require('../../shared/services/supabase.service');
const axios = require('axios');

/* ============================================================================
   RESOURCE SERVICE
   Uses getSupabase() (lazy singleton) instead of a top-level supabase import
   so the client is only created after dotenv has loaded the env vars.
============================================================================ */


// =============================================================================
// CREATE URL-BASED RESOURCE
// =============================================================================
exports.createUrlResource = async (body, userId) => {
  const { title, url, description, category } = body;

  if (!title || !category || !url) {
    const err = new Error('Title, category, and URL are required');
    err.status = 400;
    throw err;
  }

  const doc = await Resource.create({
    title,
    description: description || '',
    category,
    url,
    status:  'pending',
    addedBy: userId,
  });

  return doc;
};


// =============================================================================
// FILE UPLOAD RESOURCE
// =============================================================================
exports.createFileResource = async (body, file, userId) => {
  if (!file) {
    const err = new Error('File is required');
    err.status = 400;
    throw err;
  }

  const { title, category, description } = body;

  if (!title || !category) {
    const err = new Error('Title and category are required');
    err.status = 400;
    throw err;
  }

  try {
    // Clean filename — replace any non-safe chars with underscores
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath  = `uploads/${Date.now()}_${cleanName}`;

    // Get the lazily-initialized Supabase client
    const supabase = getSupabase();

    // Upload to Supabase bucket "resources"
    const { data, error } = await supabase.storage
      .from('resources')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error('SUPABASE UPLOAD ERROR:', error);
      const err = new Error(error.message || 'Upload failed');
      err.status = 500;
      throw err;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    const resource = await Resource.create({
      title,
      category,
      description: description || '',
      status:  'pending',
      addedBy: userId,
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

  } catch (e) {
    console.error('FILE UPLOAD ERROR:', e);
    throw e;
  }
};


// =============================================================================
// LIST APPROVED RESOURCES
// =============================================================================
exports.listApprovedResources = async (query) => {
  const {
    q        = '',
    category = '',
    page     = '1',
    limit    = '20',
    sort     = '-createdAt',
  } = query;

  const pageNum = Math.max(parseInt(page,  10) || 1,  1);
  const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filters = { status: 'approved' };

  if (category) filters.category = category;

  if (q) {
    filters.$or = [
      { title:       new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Resource.find(filters)
      .populate('addedBy', 'name')
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage),

    Resource.countDocuments(filters),
  ]);

  return {
    items,
    pagination: {
      page:  pageNum,
      pages: Math.ceil(total / perPage) || 1,
      total,
      limit: perPage,
    },
  };
};


// =============================================================================
// GET APPROVED CATEGORIES
// =============================================================================
exports.getApprovedCategories = async () => {
  const cats = await Resource.distinct('category', { status: 'approved' });
  return cats.sort();
};


// =============================================================================
// VIEW FILE (INLINE PROXY)
// =============================================================================
exports.viewFile = async (id) => {
  const resource = await Resource.findById(id);

  if (!resource || !resource.file?.url) {
    const err = new Error('File not found');
    err.status = 404;
    throw err;
  }

  const response = await axios.get(resource.file.url, {
    responseType: 'arraybuffer',
  });

  return {
    buffer:   response.data,
    mimeType: resource.file.mimeType || 'application/octet-stream',
    filename: resource.file.originalName,
  };
};


// =============================================================================
// DOWNLOAD FILE (ATTACHMENT PROXY)
// =============================================================================
exports.downloadFile = async (id) => {
  const resource = await Resource.findById(id);

  if (!resource || !resource.file?.downloadUrl) {
    const err = new Error('File not found');
    err.status = 404;
    throw err;
  }

  const response = await axios.get(resource.file.downloadUrl, {
    responseType: 'arraybuffer',
  });

  return {
    buffer:   response.data,
    mimeType: resource.file.mimeType || 'application/octet-stream',
    filename: resource.file.originalName,
  };
};