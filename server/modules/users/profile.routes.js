const express    = require('express');
const multer     = require('multer');
const requireAuth = require('../../core/middlewares/auth');
const controller  = require('./profile.controller');

const router = express.Router();

/* ============================================================================
   PROFILE ROUTES
   Combines profile.routes.js and profilephoto.routes.js into one file.
   All business logic lives in profile.service.js (via profile.controller.js).
   Base path (mounted in app.js):  /api/profile
============================================================================ */


// ── Multer — memory storage with 2 MB limit and image-only filter ────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG/PNG/WEBP allowed'));
  },
});


// POST   /api/profile/photo       — Upload photo to Cloudinary
router.post('/photo', requireAuth, upload.single('photo'), controller.uploadPhoto);

// DELETE /api/profile/photo       — Delete photo from Cloudinary
router.delete('/photo', requireAuth, controller.deletePhoto);

// DELETE /api/profile/photo/local — Delete locally stored photo (legacy fallback)
router.delete('/photo/local', requireAuth, controller.deleteLocalPhoto);


module.exports = router;