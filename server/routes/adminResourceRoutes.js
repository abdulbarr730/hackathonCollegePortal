// server/routes/adminResourceRoutes.js
const express = require('express');
const Resource = require('../models/Resource');
const requireAdmin = require('../middleware/adminAuth');
const supabase = require('../config/supabase'); // uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

const router = express.Router();
const BUCKET = 'resources';

/**
 * GET /api/admin/resources
 * List resources with filters + pagination
 * Query: status, q, category, page=1, limit=20, sort=-createdAt
 * Returns: { items: [...], pagination: {...} }
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const {
      status = '',
      q = '',
      category = '',
      page = '1',
      limit = '20',
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (q) {
      filters.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { url: new RegExp(q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Resource.find(filters)
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate('addedBy', 'name email')
        .populate('approvedBy', 'name email'),
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
    console.error('Admin list error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * GET /api/admin/resources/counts
 * Return counts by status: { pending, approved, rejected }
 */
router.get('/counts', requireAdmin, async (_req, res) => {
  try {
    const counts = await Resource.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = { pending: 0, approved: 0, rejected: 0 };
    counts.forEach((c) => {
      if (c._id && Object.prototype.hasOwnProperty.call(result, c._id)) {
        result[c._id] = c.count;
      }
    });

    return res.json(result);
  } catch (err) {
    console.error('Counts error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * POST /api/admin/resources/:id/approve
 */
router.post('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const doc = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        rejectionReason: '',
        approvedBy: req.user ? req.user._id : undefined,
      },
      { new: true }
    );
    if (!doc) return res.status(404).json({ msg: 'Not found' });
    return res.json({ msg: 'Approved', resource: doc });
  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * POST /api/admin/resources/:id/reject
 * Body: { reason?: string }
 */
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason = '' } = req.body || {};
    const doc = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason,
        approvedBy: undefined,
      },
      { new: true }
    );
    if (!doc) return res.status(404).json({ msg: 'Not found' });
    return res.json({ msg: 'Rejected', resource: doc });
  } catch (err) {
    console.error('Reject error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * PUT /api/admin/resources/:id
 * Edit title/description only
 * Body: { title?, description? }
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description } = req.body || {};
    const updates = {};
    if (typeof title === 'string') updates.title = title;
    if (typeof description === 'string') updates.description = description;

    const doc = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ msg: 'Not found' });

    return res.json({ msg: 'Resource updated', resource: doc });
  } catch (err) {
    console.error('Update error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * DELETE /api/admin/resources/:id
 * Delete resource (DB) + remove file from Supabase if present
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const doc = await Resource.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Not found' });

    try {
      const path = doc?.file?.path;
      if (path) {
        const { error } = await supabase.storage.from(BUCKET).remove([path]);
        if (error) console.error('Supabase single delete error:', error.message || error);
      }
    } catch (e) {
      console.error('Supabase single delete exception:', e);
    }

    return res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * POST /api/admin/resources/bulk-delete
 * Body: { ids: string[] }
 * Deletes from DB and removes files from Supabase
 */
router.post('/bulk-delete', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ msg: 'Invalid IDs' });
    }

    const resources = await Resource.find({ _id: { $in: ids } }, { file: 1 }).lean();
    const paths = resources
      .map((r) => r?.file?.path)
      .filter(Boolean);

    // Delete from DB
    const dbResult = await Resource.deleteMany({ _id: { $in: ids } });

    // Delete from Supabase (best-effort)
    if (paths.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(paths);
      if (error) {
        console.error('Supabase bulk delete error:', error.message || error);
      }
    }

    return res.json({
      msg: 'Bulk delete completed',
      requested: ids.length,
      deleted: dbResult?.deletedCount || 0,
      filesAttempted: paths.length,
    });
  } catch (err) {
    console.error('Bulk delete error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
