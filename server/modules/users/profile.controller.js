const profileService = require('./profile.service');

/* ============================================================================
   PROFILE CONTROLLER
   Thin HTTP layer — extracts params from req, calls profile.service.js,
   and sends the response.
============================================================================ */


// =============================================================================
// 1. UPLOAD PHOTO   POST /api/profile/photo
// =============================================================================
/**
 * Accepts a single 'photo' file (validated by Multer in the route),
 * uploads it to Cloudinary, and returns the new photo URL.
 * Access: Private
 */
const uploadPhoto = async (req, res) => {
  try {
    const result = await profileService.uploadPhoto(req.user._id, req.file);
    return res.json(result);
  } catch (err) {
    // Structured service errors { status, msg }
    if (err.status && err.msg) {
      return res.status(err.status).json({ ok: false, msg: err.msg });
    }
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, msg: 'Upload failed' });
  }
};


// =============================================================================
// 2. DELETE PHOTO (Cloudinary)   DELETE /api/profile/photo
// =============================================================================
/**
 * Removes the user's photo from Cloudinary and clears the photo fields
 * on their User document.
 * Access: Private
 */
const deletePhoto = async (req, res) => {
  try {
    const result = await profileService.deleteCloudinaryPhoto(req.user._id);
    return res.json(result);
  } catch (err) {
    if (err.status && err.msg) {
      return res.status(err.status).json({ ok: false, msg: err.msg });
    }
    console.error('Delete error:', err);
    return res.status(500).json({ ok: false, msg: 'Delete failed' });
  }
};


// =============================================================================
// 3. DELETE PHOTO (Local disk — legacy fallback)   DELETE /api/profile/photo/local
// =============================================================================
/**
 * Removes a locally stored photo from disk and clears photoUrl on the
 * User document. Used when Cloudinary is not configured.
 * Access: Private
 */
const deleteLocalPhoto = async (req, res) => {
  try {
    const result = await profileService.deleteLocalPhoto(req.user._id);
    return res.json(result);
  } catch (err) {
    if (err.status && err.msg) {
      return res.status(err.status).json({ ok: false, msg: err.msg });
    }
    console.error('Delete local error:', err);
    return res.status(500).json({ ok: false, msg: 'Delete failed' });
  }
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  uploadPhoto,
  deletePhoto,
  deleteLocalPhoto,
};