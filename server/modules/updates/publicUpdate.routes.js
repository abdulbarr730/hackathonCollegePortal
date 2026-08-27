const express = require('express');
const Update = require('./update.model');

const router = express.Router();

/**
 * GET /api/public/updates
 * Query params:
 *  - q: search by title (optional)
 *  - page, limit: pagination (defaults 1, 20)
 *  - pinnedOnly: 'true' to return only pinned items
 *  - collegeId: optional college filter
 */
router.get('/', async (req, res) => {
  try {
    const {
      q = '',
      page = '1',
      limit = '20',
      pinnedOnly = 'false',
      collegeId = ''
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filters = { isPublic: true };
    if (q) filters.title = new RegExp(q, 'i');
    if (String(pinnedOnly) === 'true') filters.pinned = true;

    if (collegeId && collegeId !== 'all') {
      filters.$or = [
        { college: null },
        { college: collegeId },
        { visibility: 'public' }
      ];
    } else {
      filters.$or = [
        { college: null },
        { visibility: 'public' }
      ];
    }

    // Always serve pinned first when not using pinnedOnly
    const sort = { pinned: -1, publishedAt: -1, createdAt: -1 };

    const [items, total] = await Promise.all([
      Update.find(filters)
        .populate('college', 'name shortName')
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      Update.countDocuments(filters),
    ]);

    res.json({
      items,
      pagination: {
        page: pageNum,
        pages: Math.max(Math.ceil(total / perPage), 1),
        total,
        limit: perPage,
      },
    });
  } catch (err) {
    console.error('Public updates list error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
