const cloudinary = require('../../shared/services/cloudinary.service');
const User = require('./user.model');
const path = require('path');
const fs = require('fs');

/* ============================================================================
   PROFILE SERVICE
   Handles profile photo upload (Cloudinary) and deletion.
   No transaction needed — each operation is a single atomic User document
   write with no cross-collection dependencies.
============================================================================ */


// ---------------------------------------------------------------------------
// HELPER
// ---------------------------------------------------------------------------

/** Throw a structured HTTP-style error */
const fail = (status, msg) => { throw { status, msg }; };


// =============================================================================
// 1. UPLOAD PHOTO (Cloudinary)
// =============================================================================
/**
 * Converts the uploaded file buffer to a base64 Data URI, uploads it to
 * Cloudinary under the user's ID (always overwriting the previous photo),
 * and saves the new URL + public_id to the User document.
 *
 * @param {string} userId     - req.user._id
 * @param {object} file       - Multer file object (req.file)
 * @returns {Promise<{ ok: boolean, photoUrl: string }>}
 */
const uploadPhoto = async (userId, file) => {
  if (!file) fail(400, 'No file uploaded');

  // Convert buffer → base64 Data URI for Cloudinary upload
  const b64     = file.buffer.toString('base64');
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder:        'app/avatars',
    public_id:     String(userId), // Always overwrite this user's photo slot
    overwrite:     true,
    resource_type: 'image',
  });

  // Persist new URL + public_id to the User document
  await User.findByIdAndUpdate(userId, {
    $set: {
      photoUrl:      result.secure_url,
      photoPublicId: result.public_id,
    },
  });

  return { ok: true, photoUrl: result.secure_url };
};


// =============================================================================
// 2. DELETE PHOTO (Cloudinary)
// =============================================================================
/**
 * Removes the user's photo from Cloudinary (best-effort — errors are swallowed
 * so a missing asset doesn't block the DB update) then clears the photo fields
 * on the User document.
 *
 * @param {string} userId - req.user._id
 * @returns {Promise<{ ok: boolean }>}
 */
const deleteCloudinaryPhoto = async (userId) => {
  const user = await User.findById(userId)
    .select('photoPublicId')
    .lean();

  if (user?.photoPublicId) {
    // Best-effort deletion — don't let a Cloudinary failure block the DB update
    await cloudinary.uploader.destroy(user.photoPublicId).catch(() => {});
  }

  await User.findByIdAndUpdate(userId, {
    $set: { photoUrl: '', photoPublicId: '' },
  });

  return { ok: true };
};


// =============================================================================
// 3. DELETE PHOTO (Local disk — legacy fallback)
// =============================================================================
/**
 * Removes a locally stored photo file from disk (used when Cloudinary is not
 * configured) and clears the photoUrl field on the User document.
 *
 * File deletion is best-effort — errors are silently ignored so a missing file
 * on disk doesn't prevent the DB from being cleared.
 *
 * @param {string} userId - req.user._id
 * @returns {Promise<{ ok: boolean }>}
 */
const deleteLocalPhoto = async (userId) => {
  const user = await User.findById(userId)
    .select('photoUrl')
    .lean();

  if (user?.photoUrl) {
    const urlObject   = new URL(user.photoUrl);
    const relativePath = urlObject.pathname;
    const diskPath    = path.join(
      __dirname, '..', '..',
      relativePath.replace(/^\/+/, '')
    );

    // Best-effort unlink — silently ignore if file doesn't exist
    fs.unlink(diskPath, () => {});
  }

  await User.findByIdAndUpdate(userId, {
    $set: { photoUrl: '' },
  });

  return { ok: true };
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  uploadPhoto,
  deleteCloudinaryPhoto,
  deleteLocalPhoto,
};