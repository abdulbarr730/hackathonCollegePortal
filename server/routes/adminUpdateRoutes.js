const express = require('express');
const Update = require('../models/Update');
const { runFeederOnce } = require('../services/sihFeeder');
const { notifyUsersNewUpdates } = require('../services/updateNotifications');
const crypto = require('crypto');

// NOTE: Plug your admin guard here
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

/**
 * Manual ingest for Admin UI
 * Auth: admin-only (cookie/JWT middleware); NO secret header
 */
router.post('/ingest-ui', /* requireAdmin, */ async (req, res) => {
  try {
    const sourceUrl = process.env.FEEDER_SOURCE_URL || 'https://sih.gov.in/';
    const useHeadless = String(process.env.PLAYWRIGHT_ENABLED || 'true') === 'true';

    const { inserted, insertedDocs, error } = await runFeederOnce({
      sourceUrl,
      useHeadlessFallback: useHeadless,
    });

    if (insertedDocs?.length) {
      notifyUsersNewUpdates(insertedDocs).catch(e => console.error('notifyUsersNewUpdates error:', e));
    }

    if (error) return res.status(200).json({ ok: false, inserted, error });
    return res.json({ ok: true, inserted });
  } catch (err) {
    console.error('Admin ingest-ui error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Manual ingest for external scheduler
 * Auth: requires X-Feeder-Secret header matching FEEDER_SECRET
 */
router.post('/ingest', async (req, res) => {
  try {
    const secret = process.env.FEEDER_SECRET || '';
    if (!secret || req.headers['x-feeder-secret'] !== secret) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const sourceUrl = process.env.FEEDER_SOURCE_URL || 'https://sih.gov.in/';
    const useHeadless = String(process.env.PLAYWRIGHT_ENABLED || 'true') === 'true';

    const { inserted, insertedDocs, error } = await runFeederOnce({
      sourceUrl,
      useHeadlessFallback: useHeadless,
    });

    if (insertedDocs?.length) {
      notifyUsersNewUpdates(insertedDocs).catch(e => console.error('notifyUsersNewUpdates error:', e));
    }

    if (error) return res.status(200).json({ ok: false, inserted, error });
    return res.json({ ok: true, inserted });
  } catch (err) {
    console.error('Admin ingest error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Admin list
 */
router.get('/', /* requireAdmin, */ async (req, res) => {
  try {
    const { q = '', page = '1', limit = '20', sort = '-publishedAt' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filters = {};
    if (q) filters.title = new RegExp(q, 'i');

    const [items, total] = await Promise.all([
      Update.find(filters).sort(sort).skip((pageNum - 1) * perPage).limit(perPage).lean(),
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
    console.error('Admin updates list error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Create a new update
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ msg: 'Request body is missing' });
    }
    
    const { title, summary, url, isPublic, pinned, publishedAt } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ msg: 'A valid title is required' });
    }
    
    // 2. Create a unique string from the update's content
    const uniqueString = `${title.trim()}${url || ''}`;

    // 3. Generate the hash using that unique string
    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');

    const newUpdate = new Update({
      title: title.trim(),
      summary: summary || '',
      url: url || '',
      isPublic: !!isPublic,
      pinned: !!pinned,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      hash: hash, // 4. Add the hash to the new document
    });

    const savedUpdate = await newUpdate.save();
    
    res.status(201).json({ ok: true, item: savedUpdate });
  } catch (err) {
    // Check for duplicate key error (if the hash already exists)
    if (err.code === 11000) {
      return res.status(409).json({ msg: 'This update already exists.' });
    }
    console.error('Admin create update error:', err); 
    res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * Edit update (pin/publish/edit fields)
 */
router.put('/:id', /* requireAdmin, */ async (req, res) => {
  try {
    const { title, summary, publishedAt, pinned, isPublic, url } = req.body || {};
    const patch = {};
    if (title !== undefined) patch.title = String(title);
    if (summary !== undefined) patch.summary = String(summary);
    if (url !== undefined) patch.url = String(url);
    if (publishedAt !== undefined) patch.publishedAt = publishedAt ? new Date(publishedAt) : null;
    if (pinned !== undefined) patch.pinned = !!pinned;
    if (isPublic !== undefined) patch.isPublic = !!isPublic;

    const updated = await Update.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!updated) return res.status(404).json({ msg: 'Not found' });
    res.json({ ok: true, item: updated });
  } catch (err) {
    console.error('Admin update edit error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Update an existing update
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, summary, url, pinned, isPublic } = req.body;
    const update = await Update.findByIdAndUpdate(
      req.params.id,
      { title, summary, url, pinned, isPublic },
      { new: true }
    );
    if (!update) return res.status(404).json({ msg: 'Update not found' });
    res.json(update);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});
// Delete an update
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const update = await Update.findByIdAndDelete(req.params.id);
    if (!update) return res.status(404).json({ msg: 'Update not found' });
    res.json({ msg: 'Update removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});
// Manual notify: send an email to users about specific public updates
// POST /api/admin/updates/notify
// Body: { ids: ["<updateId1>", "<updateId2>", ...] }
router.post('/notify', /* requireAdmin, */ async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ msg: 'No ids provided' });

    // Only notify for public updates to avoid leaking hidden content
    const items = await Update.find({ _id: { $in: ids }, isPublic: true })
      .select('title url publishedAt source')
      .lean();

    if (!items.length) return res.status(404).json({ msg: 'No matching public items' });

    await notifyUsersNewUpdates(items);

    return res.json({ ok: true, notified: items.length });
  } catch (err) {
    console.error('Admin notify error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
