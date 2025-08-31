const express = require('express');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

function safeUnlink(absPath) {
  fs.unlink(absPath, () => {});
}

/**
 * List resources with filters + pagination
 * GET /api/admin/resources
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status = '', q = '', category = '', page = '1', limit = '20', sort = '-createdAt' } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (q) {
      filters.$or = [{ title: new RegExp(q, 'i') }, { url: new RegExp(q, 'i') }];
    }

    const [items, total] = await Promise.all([
      Resource.find(filters)
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate('addedBy', 'name email')
        .populate('approvedBy', 'name email')
        .lean(),
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
 * Counts by status
 * GET /api/admin/resources/counts
 */
router.get('/counts', requireAdmin, async (req, res) => {
  try {
    const counts = await Resource.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const result = { pending: 0, approved: 0, rejected: 0 };
    counts.forEach(c => {
      if (c._id && result.hasOwnProperty(c._id)) {
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
 * Approve
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
    return res.json({ msg: 'Approved' });
  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Reject
 * POST /api/admin/resources/:id/reject
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
    return res.json({ msg: 'Rejected' });
  } catch (err) {
    console.error('Reject error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Delete resource (also remove uploaded file if exists)
 * DELETE /api/admin/resources/:id
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const doc = await Resource.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Not found' });
    if (doc.file?.filename) {
      const abs = path.join(__dirname, '..', 'uploads', 'resources', doc.file.filename);
      safeUnlink(abs);
    }
    return res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
