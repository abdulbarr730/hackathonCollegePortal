const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const Resource = require('../models/Resource');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Multer setup (memory storage only)
 */
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  },
});

/**
 * Helper: upload buffer to Cloudinary
 */
function uploadToCloudinary(fileBuffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

/**
 * URL-based submission (no file)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title = '', url = '', category = '', tags = '' } = req.body;

    if (!title.trim() || !category.trim() || !url.trim()) {
      return res.status(400).json({ msg: 'title, category, and url are required' });
    }

    const tagList = String(tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const doc = await Resource.create({
      title: title.trim(),
      category: category.trim(),
      url: url.trim(),
      tags: tagList,
      status: 'pending',
      addedBy: req.user._id,
    });

    return res.status(201).json({ msg: 'Submitted for review', resourceId: doc._id });
  } catch (err) {
    console.error('Create URL resource error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * File upload (or file + url)
 */
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { title = '', category = '', tags = '', url = '' } = req.body;

    if (!title.trim() || !category.trim()) {
      return res.status(400).json({ msg: 'title and category are required' });
    }

    const hasFile = !!req.file;
    const hasUrl = !!(url && url.trim());
    if (!hasFile && !hasUrl) {
      return res.status(400).json({ msg: 'Provide a URL or upload a file' });
    }

    let fileBlock;
    if (hasFile) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        resource_type: 'auto',
        folder: 'resources',
      });

      // ✅ Only keep Cloudinary info
      fileBlock = {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    }

    const tagList = String(tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const doc = await Resource.create({
      title: title.trim(),
      category: category.trim(),
      url: hasUrl ? url.trim() : '',
      tags: tagList,
      status: 'pending',
      addedBy: req.user._id,
      ...(fileBlock ? { file: fileBlock } : {}),
    });

    return res.status(201).json({ msg: 'Submitted for review', resourceId: doc._id });
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
    const { q = '', category = '', tag = '', page = '1', limit = '20', sort = '-createdAt' } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filters = { status: 'approved' };
    if (category) filters.category = category;
    if (tag) filters.tags = tag;
    if (q) {
      filters.$or = [{ title: new RegExp(q, 'i') }, { url: new RegExp(q, 'i') }];
    }

    const [items, total] = await Promise.all([
      Resource.find(filters)
        .populate('addedBy', 'name')
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      Resource.countDocuments(filters),
    ]);

    return res.json({
      items,
      pagination: {
        page: pageNum,
        pages: Math.max(Math.ceil(total / perPage), 1),
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

module.exports = router;
