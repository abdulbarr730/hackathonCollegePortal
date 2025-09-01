const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const Resource = require('../models/Resource');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Multer setup (memory storage for Cloudinary)
 */
const upload = multer({
  storage: multer.memoryStorage(), // MODIFIED: Use memory storage
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

/**
 * Helper: upload buffer to Cloudinary
 */
function uploadToCloudinary(fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        resource_type: 'raw',
        folder: 'resources',
        use_filename: true,
        unique_filename: false,
        filename_override: filename,
      },
      (err, result) => {
        if (err) return reject(err);

        // Build a proper download URL
        const downloadUrl = cloudinary.url(result.public_id, {
          resource_type: 'raw',
          flags: 'attachment',   // forces download
          secure: true,
          filename_override: filename,
        });

        resolve({ ...result, downloadUrl });
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
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
      url,
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

    // Upload the file buffer from memory to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const fileData = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,           // view online
      downloadUrl: uploadResult.downloadUrl,  // ✅ direct download
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

    // MODIFIED: Re-added pagination logic to fetch items and total count in parallel
    const [items, total] = await Promise.all([
      Resource.find(filters)
        .populate('addedBy', 'name')
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage), // Removed .lean() for robustness to ensure file objects are included
      Resource.countDocuments(filters),
    ]);

    // MODIFIED: Returning a full pagination object for the frontend
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


module.exports = router;