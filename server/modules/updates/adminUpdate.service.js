const Update = require('./update.model');
const crypto = require('crypto');
const Hackathon = require('../hackathons/hackathon.model');
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
        { college: collegeId }, // This college internal updates
        { visibility: 'public' } // Public updates from other partner colleges
      ]
    };
  }

  const updates = await Update.find(filter)
    .populate('hackathon', 'name shortName')
    .populate('college', 'name shortName')
    .populate('author', 'name email role')
    .sort({ pinned: -1, publishedAt: -1, createdAt: -1 });

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
  const { title, summary, url, isPublic, pinned, hackathon, fileUrl, college, visibility = 'private' } = body;

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
    visibility: visibility === 'public' ? 'public' : 'private',
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
   UPDATE UPDATE (Only author's college admin or Super Admin can edit)
============================================================================ */
exports.updateUpdate = async (id, body, requester = null) => {
  const existing = await Update.findById(id);
  if (!existing) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

  if (requester && !isSuperAdmin(requester)) {
    if (!requester.college) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }
    const userCollegeId = String(requester.college._id || requester.college);
    const existingColId = String(existing.college?._id || existing.college || '');

    // If it is a global official update or belongs to another college, reject edit
    if (!existing.college || existingColId !== userCollegeId) {
      const err = new Error('You do not have permission to edit announcements posted by another college or platform administrators.');
      err.status = 403;
      throw err;
    }
  }

  const { title, summary, url, fileUrl, isPublic, pinned, hackathon, visibility, college } = body;
  const updates = {};
  if (title) updates.title = title.trim();
  if (summary !== undefined) updates.summary = summary.trim();
  if (url !== undefined) updates.url = url.trim();
  if (fileUrl !== undefined) updates.fileUrl = fileUrl;
  if (isPublic !== undefined) updates.isPublic = isPublic;
  if (pinned !== undefined) updates.pinned = pinned;
  if (hackathon !== undefined) updates.hackathon = hackathon || null;
  if (visibility) updates.visibility = visibility === 'public' ? 'public' : 'private';

  // Only super admins can reassign college ownership
  if (isSuperAdmin(requester) && college !== undefined) {
    updates.college = college && college !== 'all' ? college : null;
  }

  const updated = await Update.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true }
  ).populate('hackathon', 'name shortName')
   .populate('college', 'name shortName')
   .populate('author', 'name email role');

  return updated;
};

/* ============================================================================
   DELETE UPDATE (Only author's college admin or Super Admin can delete)
============================================================================ */
exports.deleteUpdate = async (id, requester = null) => {
  const existing = await Update.findById(id);
  if (!existing) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

  if (requester && !isSuperAdmin(requester)) {
    if (!requester.college) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }
    const userCollegeId = String(requester.college._id || requester.college);
    const existingColId = String(existing.college?._id || existing.college || '');

    if (!existing.college || existingColId !== userCollegeId) {
      const err = new Error('You do not have permission to delete announcements posted by another college or platform administrators.');
      err.status = 403;
      throw err;
    }
  }

  await Update.findByIdAndDelete(id);
  return true;
};

/* ============================================================================
   DISPATCH NOTIFICATION EMAIL FOR UPDATE (Super Admin Only)
============================================================================ */
exports.dispatchUpdateEmail = async (id, requester = null) => {
  const updateDoc = await Update.findById(id);
  if (!updateDoc) {
    const err = new Error('Update not found');
    err.status = 404;
    throw err;
  }

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
  if (!activeHackathon) throw new Error("No active hackathon found to tag updates against");

  const result = await Update.updateMany(
    { hackathon: null },
    { $set: { hackathon: activeHackathon._id } }
  );

  return { msg: `Successfully tagged ${result.modifiedCount} updates to '${activeHackathon.name}'!` };
};
