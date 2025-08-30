const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const requireAuth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Multer: keep file in memory (not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG/PNG/WEBP allowed'));
  },
});

// ------------------ Upload Photo ------------------
router.post('/photo', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, msg: 'No file uploaded' });
    }

    // Convert buffer → base64 Data URI
    const b64 = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'app/avatars',              // folder in your Cloudinary
      public_id: String(req.user._id),    // always overwrite this user's photo
      overwrite: true,
      resource_type: 'image',
    });

    // Save to DB
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        photoUrl: result.secure_url,
        photoPublicId: result.public_id,
      },
    });

    return res.json({ ok: true, photoUrl: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, msg: 'Upload failed' });
  }
});

// ------------------ Delete Photo ------------------
router.delete('/photo', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('photoPublicId').lean();

    if (user?.photoPublicId) {
      await cloudinary.uploader.destroy(user.photoPublicId).catch(() => {});
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { photoUrl: '', photoPublicId: '' },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ ok: false, msg: 'Delete failed' });
  }
});

module.exports = router;
