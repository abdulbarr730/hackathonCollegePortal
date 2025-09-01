const express = require('express');
const multer = require('multer');
const axios = require('axios');

const Resource = require('../models/Resource');
const auth = require('../middleware/auth');
const supabase = require('../config/supabase'); // ✅ shared supabase config

const router = express.Router();

/**
 * Multer setup (memory storage for Supabase)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const BUCKET = 'resources';

/**
 * Helper: upload buffer to Supabase
 */
async function uploadToSupabase(fileBuffer, filename, mimetype) {
  const publicId = `${Date.now()}-${filename}`; // ✅ treat as publicId

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(publicId, fileBuffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) throw error;

  // Get a public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(publicId);

  const viewUrl = data.publicUrl;
  const downloadUrl = `${data.publicUrl}?download=${encodeURIComponent(filename)}`;

  return { publicId, viewUrl, downloadUrl };
}

/**
 * @route   POST /api/resources
 * @desc    URL-based submission
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, url, description, category } = req.body;

    if (!title || !category || !url) {
      return res.status(400).json({ msg: 'Title, category, and URL are required' });
    }

    const doc = await Resource.create({
      title,
      description: description || '',
      category,
      url, // external resource link
      status: 'pending',
      addedBy: req.user._id,
    });

    return res.status(201).json({ msg: 'Submitted for review', resource: doc });
  } catch (err) {
    console.error('Create URL resource error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * @route   POST /api/resources/upload
 * @desc    File upload submission
 */
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title || !category) {
      return res.status(400).json({ msg: 'Title and category are required' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'A file is required for upload.' });
    }

    // Upload to Supabase
    const uploadResult = await uploadToSupabase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const fileData = {
      publicId: uploadResult.publicId, // ✅ required in schema
      url: uploadResult.viewUrl,
      downloadUrl: uploadResult.downloadUrl,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    };

    const doc = await Resource.create({
      title,
      category,
      description: description || '',
      status: 'pending',
      addedBy: req.user._id,
      file: fileData,
    });

    return res.status(201).json({ msg: 'File submitted for review', resource: doc });
  } catch (err) {
    console.error('Upload resource error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Public listing of approved resources
 */
router.get('/', async (req, res) => {
  try {
    const { q = '', category = '', page = '1', limit = '20', sort = '-createdAt' } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filters = { status: 'approved' };
    if (category) filters.category = category;
    if (q) {
      filters.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    }

    const [items, total] = await Promise.all([
      Resource.find(filters)
        .populate('addedBy', 'name')
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage),
      Resource.countDocuments(filters),
    ]);

    return res.json({
      items,
      pagination: {
        page: pageNum,
        pages: Math.ceil(total / perPage) || 1,
        total,
        limit: perPage,
      },
    });
  } catch (err) {
    console.error('List resources error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Approved categories
 */
router.get('/categories', async (_req, res) => {
  try {
    const cats = await Resource.distinct('category', { status: 'approved' });
    return res.json(cats.sort());
  } catch (err) {
    console.error('Categories error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Proxy: View file inline
 */
router.get('/:id/view', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.file?.url) {
      return res.status(404).json({ msg: 'File not found' });
    }

    const fileUrl = resource.file.url;
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    res.setHeader('Content-Type', resource.file.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resource.file.originalName}"`);
    res.send(response.data);
  } catch (err) {
    console.error('Proxy view error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch file' });
  }
});

/**
 * Proxy: Download file
 */
router.get('/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.file?.downloadUrl) {
      return res.status(404).json({ msg: 'File not found' });
    }

    const fileUrl = resource.file.downloadUrl;
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    res.setHeader('Content-Type', resource.file.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resource.file.originalName}"`);
    res.send(response.data);
  } catch (err) {
    console.error('Proxy download error:', err.message);
    res.status(500).json({ msg: 'Failed to download file' });
  }
});

module.exports = router;
