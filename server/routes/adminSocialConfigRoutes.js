const express = require('express');
const AdminConfig = require('../models/AdminConfig');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

const ALL_PLATFORMS = [
  'linkedin','github','stackoverflow','devto','medium',
  'leetcode','geeksforgeeks','kaggle','codeforces','codechef'
];

// GET current config
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const cfg = await AdminConfig.findOne({ key: 'allowedSocialPlatforms' }).lean();
  const allowed = Array.isArray(cfg?.value) && cfg.value.length ? cfg.value : ALL_PLATFORMS;
  res.json({ allowedPlatforms: allowed, allPlatforms: ALL_PLATFORMS });
});

// PUT update config
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  const requested = Array.isArray(req.body?.allowedPlatforms) ? req.body.allowedPlatforms : [];
  const valid = requested.filter((p) => ALL_PLATFORMS.includes(p));
  const value = valid.length ? valid : ALL_PLATFORMS;
  await AdminConfig.findOneAndUpdate(
    { key: 'allowedSocialPlatforms' },
    { $set: { value, description: 'Platforms allowed for user social profiles' } },
    { upsert: true }
  );
  res.json({ ok: true, allowedPlatforms: value });
});

module.exports = router;
