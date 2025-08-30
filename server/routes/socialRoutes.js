const express = require('express');
const User = require('../models/User');
const AdminConfig = require('../models/AdminConfig');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const PLATFORM_META = {
  linkedin: { label: 'LinkedIn', pattern: /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_.~%]+\/?$/ },
  github: { label: 'GitHub', pattern: /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9-_.~%]+\/?$/ },
  stackoverflow: { label: 'Stack Overflow', pattern: /^https:\/\/(www\.)?stackoverflow\.com\/users\/[0-9]+\/[a-zA-Z0-9-_.~%]+\/?$/ },
  devto: { label: 'Dev.to', pattern: /^https:\/\/(www\.)?dev\.to\/[a-zA-Z0-9-_.~%]+\/?$/ },
  medium: { label: 'Medium', pattern: /^https:\/\/(www\.)?medium\.com\/@?[a-zA-Z0-9-_.~%]+\/?$/ },
  leetcode: { label: 'LeetCode', pattern: /^https:\/\/(www\.)?leetcode\.com\/[a-zA-Z0-9-_.~%]+\/?$/ },
  geeksforgeeks: { label: 'GeeksforGeeks', pattern: /^https:\/\/(www\.)?geeksforgeeks\.org\/user\/[a-zA-Z0-9-_.~%]+\/?$/ },
  kaggle: { label: 'Kaggle', pattern: /^https:\/\/(www\.)?kaggle\.com\/[a-zA-Z0-9-_.~%]+\/?$/ },
  codeforces: { label: 'Codeforces', pattern: /^https:\/\/(www\.)?codeforces\.com\/profile\/[a-zA-Z0-9-_.~%]+\/?$/ },
  codechef: { label: 'CodeChef', pattern: /^https:\/\/(www\.)?codechef\.com\/users\/[a-zA-Z0-9-_.~%]+\/?$/ },
};

const DEFAULT_ALLOWED = Object.keys(PLATFORM_META);

// GET allowed platforms (public)
router.get('/config', async (_req, res) => {
  const cfg = await AdminConfig.findOne({ key: 'allowedSocialPlatforms' }).lean();
  const allowed = Array.isArray(cfg?.value) && cfg.value.length ? cfg.value : DEFAULT_ALLOWED;
  res.json({ allowedPlatforms: allowed });
});

// GET my social profiles
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).select('socialProfiles').lean();
  res.json({ socialProfiles: user?.socialProfiles || {} });
});

// PUT update my social profiles
router.put('/me', requireAuth, async (req, res) => {
  const cfg = await AdminConfig.findOne({ key: 'allowedSocialPlatforms' }).lean();
  const allowed = Array.isArray(cfg?.value) && cfg.value.length ? cfg.value : DEFAULT_ALLOWED;

  const incoming = req.body?.socialProfiles || {};
  const updates = {};

  for (const key of Object.keys(PLATFORM_META)) {
    if (!allowed.includes(key)) {
      updates[`socialProfiles.${key}`] = ''; // purge if disabled
      continue;
    }
    const raw = (incoming[key] || '').trim();
    if (!raw) {
      updates[`socialProfiles.${key}`] = '';
      continue;
    }
    const ok = PLATFORM_META[key].pattern.test(raw);
    if (!ok) {
      return res.status(400).json({ msg: `Invalid URL for ${PLATFORM_META[key].label}` });
    }
    updates[`socialProfiles.${key}`] = raw;
  }

  await User.findByIdAndUpdate(req.user._id, { $set: updates });
  res.json({ ok: true });
});

// GET public social profiles of a userId (to show teammates)
router.get('/:userId', requireAuth, async (req, res) => {
  const u = await User.findById(req.params.userId).select('name socialProfiles').lean();
  if (!u) return res.status(404).json({ msg: 'User not found' });
  res.json({ name: u.name, socialProfiles: u.socialProfiles || {} });
});

module.exports = router;
