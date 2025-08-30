const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const Resource = require('../models/Resource');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'resources');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeOriginal = file.originalname.replace(/[^\w.-]+/g, '_');
    cb(null, `${unique}-${safeOriginal}`);
  },
});

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
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  },
});

function safeUnlink(absPath) {
  fs.unlink(absPath, () => {});
}

/**
 * URL-based submission (requires auth so we have req.user)
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
 * File (and/or URL) upload submission (requires auth)
 * Field name must be "file"
 */
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { title = '', category = '', tags = '', url = '' } = req.body;

    if (!title.trim() || !category.trim()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ msg: 'title and category are required' });
    }

    const hasFile = !!req.file;
    const hasUrl = !!(url && url.trim());
    if (!hasFile && !hasUrl) {
      return res.status(400).json({ msg: 'Provide a URL or upload a file' });
    }

    let fileBlock;
    if (hasFile) {
      const relPath = `/uploads/resources/${path.basename(req.file.path)}`;
      fileBlock = {
        filename: path.basename(req.file.path),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: relPath,
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
      Resource.find(filters).sort(sort).skip((pageNum - 1) * perPage).limit(perPage).lean(),
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
 * Approved categories (for filters)
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
