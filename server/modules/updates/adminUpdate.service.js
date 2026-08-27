const Update = require('./update.model');
const crypto = require('crypto');
const Hackathon = require('../hackathons/hackathon.model');
const supabase = require('../../shared/services/supabase.service');
const { isSuperAdmin } = require('../../core/utils/roleHelper');
const { scrapeSIH } = require('./update.scraper');
const { notifyUsersNewUpdates } = require('../../shared/services/updateNotifications.service');

/* ============================================================================
   LIST UPDATES (Scoped by College for SPOCs, All for Super Admin)
============================================================================ */
exports.listUpdates = async (requester = null) => {
  let filter = {};

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const collegeId = requester.college._id || requester.college;
    filter = {
      $or: [
        { college: null }, // Global SIH official updates
        { college: collegeId } // This college internal updates
      ]
    };
  }

  const updates = await Update.find(filter)
    .populate('hackathon', 'name shortName')
    .populate('college', 'name shortName')
    .populate('author', 'name email role')
    .sort({ pinned: -1, publishedAt: -1 });

  return { items: updates };
};

exports.deleteScrapedUpdates = async () => {
  const result = await Update.deleteMany({ source: 'sih_official' });
  return { count: result.deletedCount || 0 };
};

/* ============================================================================
   CREATE UPDATE
============================================================================ */
exports.createUpdate = async (body, requester = null) => {
  const { title, summary, url, isPublic, pinned, hackathon, fileUrl, college } = body;

  if (!title?.trim()) {
    const err = new Error('Title required');
    err.status = 400;
    throw err;
  }

  let assignedCollege = null;
  if (requester && !isSuperAdmin(requester) && requester.college) {
    assignedCollege = requester.college._id || requester.college;
  } else if (college && college !== 'all') {
    assignedCollege = college;
  }

  const newUpdate = new Update({
    title: title.trim(),
    summary: summary?.trim(),
    url: url?.trim(),
    fileUrl,
    isPublic: isPublic !== undefined ? isPublic : true,
    pinned: pinned || false,
    hackathon: hackathon || null,
    college: assignedCollege,
    author: requester?._id || null,
    source: 'manual',
    requiresReview: false,
    emailDispatched: false,
    hash: crypto
      .createHash('sha256')
      .update(title + (url || '') + (assignedCollege || '') + Date.now())
      .digest('hex')
  });

  await newUpdate.save();
  return newUpdate;
};

/* ============================================================================
   UPDATE UPDATE
============================================================================ */
exports.updateUpdate = async (id, body, requester = null) => {
  const existing = await Update.findById(id);
  if (!existing) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to edit updates from another college.');
      err.status = 403;
      throw err;
    }
  }

  const updated = await Update.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  return updated;
};

/* ============================================================================
   DELETE UPDATE
============================================================================ */
exports.deleteUpdate = async (id, requester = null) => {
  const existing = await Update.findById(id);
  if (!existing) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

  if (requester && !isSuperAdmin(requester) && requester.college) {
    const userCollegeId = String(requester.college._id || requester.college);
    if (existing.college && String(existing.college) !== userCollegeId) {
      const err = new Error('You do not have permission to delete updates from another college.');
      err.status = 403;
      throw err;
    }
  }

  await Update.findByIdAndDelete(id);
  return true;
};

/* ============================================================================
   DISPATCH NOTIFICATION EMAIL FOR UPDATE (Super Admin / SPOC 1-Click Trigger)
============================================================================ */
exports.dispatchUpdateEmail = async (id, requester = null) => {
  const updateDoc = await Update.findById(id);
  if (!updateDoc) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

  // Trigger dispatch to relevant users
  await notifyUsersNewUpdates([updateDoc]);

  updateDoc.emailDispatched = true;
  updateDoc.emailDispatchedAt = new Date();
  updateDoc.requiresReview = false;
  await updateDoc.save();

  return { ok: true, msg: 'Update notification email successfully dispatched to all relevant students and team leaders!' };
};

/* ============================================================================
   RETAG ALL UPDATES TO ACTIVE HACKATHON
============================================================================ */
exports.retagAllUpdates = async () => {
  const activeHackathon = await Hackathon.findOne({ isActive: true });
  if (!activeHackathon) {
    const err = new Error('No active hackathon found');
    err.status = 400;
    throw err;
  }

  const result = await Update.updateMany({}, { hackathon: activeHackathon._id });
  return { count: result.modifiedCount || 0, name: activeHackathon.name };
};

/* ============================================================================
   UPLOAD UPDATE FILE (PDF) TO SUPABASE
============================================================================ */
exports.uploadUpdateFile = async (file) => {
  if (!file) {
    const err = new Error('No file provided');
    err.status = 400;
    throw err;
  }

  const fileName = `updates/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
  const { data, error } = await supabase.storage
    .from('resources')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  const { data: publicData } = supabase.storage
    .from('resources')
    .getPublicUrl(fileName);

  return publicData.publicUrl;
};

/* ============================================================================
   MANUAL SYNC SIH NOW TRIGGER
============================================================================ */
exports.syncSIHNow = async () => {
  const result = await scrapeSIH();
  return result;
};
