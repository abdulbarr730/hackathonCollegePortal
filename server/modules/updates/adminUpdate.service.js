const Update = require('./update.model');
const crypto = require('crypto');
const Hackathon = require('../hackathons/hackathon.model');
const supabase = require('../../shared/services/supabase.service');


/* ============================================================================
   LIST UPDATES
============================================================================ */
exports.listUpdates = async () => {

  const updates = await Update.find()
    .populate('hackathon', 'name shortName')
    .sort({ pinned: -1, publishedAt: -1 });

  return { items: updates };
};

/* ============================================================================
   CREATE UPDATE
============================================================================ */
exports.createUpdate = async (body) => {

  const { title, summary, url, isPublic, pinned, hackathon, fileUrl } = body;

  if (!title?.trim()) {
    const err = new Error('Title required');
    err.status = 400;
    throw err;
  }

  const newUpdate = new Update({
    title,
    summary,
    url,
    fileUrl,
    isPublic,
    pinned,
    hackathon: hackathon || null,
    source: 'manual',
    hash: crypto
      .createHash('sha256')
      .update(title + (url || ''))
      .digest('hex')
  });

  await newUpdate.save();

  return newUpdate;
};

/* ============================================================================
   UPDATE UPDATE
============================================================================ */
exports.updateUpdate = async (id, body) => {

  const updated = await Update.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  if (!updated) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

  return updated;
};


/* ============================================================================
   DELETE UPDATE
============================================================================ */
exports.deleteUpdate = async (id) => {

  const deleted = await Update.findByIdAndDelete(id);

  if (!deleted) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

  return true;
};

/* ============================================================================
   RETAG ALL UPDATES TO ACTIVE HACKATHON
============================================================================ */
exports.retagAllUpdates = async () => {

  const activeHackathon = await Hackathon.findOne({ isActive: true });

  if (!activeHackathon) {
    const err = new Error('No Active Hackathon found.');
    err.status = 400;
    throw err;
  }

  const result = await Update.updateMany(
    { hackathon: null },
    { $set: { hackathon: activeHackathon._id } }
  );

  return {
    count: result.modifiedCount,
    name: activeHackathon.name
  };
};

/* ============================================================================
   UPLOAD FILE TO SUPABASE
============================================================================ */
exports.uploadUpdateFile = async (file) => {

  if (!file) {
    const err = new Error('No file uploaded');
    err.status = 400;
    throw err;
  }

  const fileExt = file.originalname.split('.').pop();
  const cleanName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const { error } = await supabase.storage
    .from('updates')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    const err = new Error(error.message || 'Upload failed');
    err.status = 500;
    throw err;
  }

  const { data } = supabase.storage
    .from('updates')
    .getPublicUrl(filePath);

  return data.publicUrl;
};