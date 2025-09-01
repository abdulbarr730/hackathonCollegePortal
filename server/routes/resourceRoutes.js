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
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'resources' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
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
    const uploadResult = await uploadToCloudinary(req.file.buffer);

    const fileData = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
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

// @route   GET /api/resources/:id/download-link
// @desc    Generate a secure, temporary download link for a private file
// @access  Private
router.get('/:id/download-link', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).select('file');
    if (!resource || !resource.file?.publicId) {
      return res.status(404).json({ msg: 'No downloadable file found for this resource.' });
    }

    // Generate a signed URL, specifying the resource type as 'raw' for non-image files
    const signedUrl = cloudinary.url(resource.file.publicId, {
      resource_type: 'raw', // This tells Cloudinary it's a file, not an image
      sign_url: true,
      attachment: resource.file.originalName, // Prompts a download with the correct filename
    });

    res.json({ downloadUrl: signedUrl });
  } catch (err) {
    console.error('Error generating download link:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;