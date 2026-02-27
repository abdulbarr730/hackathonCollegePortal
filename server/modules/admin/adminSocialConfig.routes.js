const express = require('express');
const AdminConfig = require('./adminConfig.model');
const requireAuth = require('../../core/middlewares/auth');
const requireAdmin = require('../../core/middlewares/adminAuth');

const router = express.Router();

const ALL_PLATFORMS = [
  'linkedin','github','stackoverflow','devto','medium',
  'leetcode','geeksforgeeks','kaggle','codeforces','codechef'
];

/* ================= GET CONFIG ================= */
router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const cfg = await AdminConfig.findOne({ key: 'allowedSocialPlatforms' }).lean();
    const allowed = Array.isArray(cfg?.value) && cfg.value.length ? cfg.value : ALL_PLATFORMS;

    res.json({
      allowedPlatforms: allowed,
      allPlatforms: ALL_PLATFORMS
    });
  } catch (err) {
    next(err);
  }
});

/* ================= UPDATE CONFIG ================= */
router.put('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const requested = Array.isArray(req.body?.allowedPlatforms)
      ? req.body.allowedPlatforms
      : [];

    const valid = requested.filter(p => ALL_PLATFORMS.includes(p));
    const value = valid.length ? valid : ALL_PLATFORMS;

    await AdminConfig.findOneAndUpdate(
      { key: 'allowedSocialPlatforms' },
      { $set: { value, description: 'Platforms allowed for user social profiles' } },
      { upsert: true }
    );

    res.json({ ok: true, allowedPlatforms: value });

  } catch (err) {
    next(err);
  }
});

module.exports = router;