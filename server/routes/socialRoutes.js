// routes/socialRoutes.js
const express = require('express');
const User = require('../models/User');
const AdminConfig = require('../models/AdminConfig');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// -------------------- Platform Meta --------------------
const PLATFORM_META = {
  linkedin: {
    label: 'LinkedIn',
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/.+$/i,
    template: (u) => `https://www.linkedin.com/in/${u}`,
    example: 'https://www.linkedin.com/in/your-username'
  },
  github: {
    label: 'GitHub',
    pattern: /^https?:\/\/(www\.)?github\.com\/.+$/i,
    template: (u) => `https://github.com/${u}`,
    example: 'https://github.com/your-username'
  },
  stackoverflow: {
    label: 'Stack Overflow',
    pattern: /^https?:\/\/(www\.)?stackoverflow\.com\/.+$/i,
    template: (u) => `https://stackoverflow.com/users/${u}`,
    example: 'https://stackoverflow.com/users/your-id'
  },
  devto: {
    label: 'Dev.to',
    pattern: /^https?:\/\/(dev\.to|www\.dev\.to)\/.+$/i,
    template: (u) => `https://dev.to/${u}`,
    example: 'https://dev.to/your-username'
  },
  medium: {
    label: 'Medium',
    pattern: /^https?:\/\/(www\.)?medium\.com\/.+$/i,
    template: (u) => `https://medium.com/@${u}`,
    example: 'https://medium.com/@your-username'
  },
  leetcode: {
    label: 'LeetCode',
    pattern: /^https?:\/\/(www\.)?leetcode\.com\/.+$/i,
    template: (u) => `https://leetcode.com/${u}`,
    example: 'https://leetcode.com/your-username'
  },
  geeksforgeeks: {
    label: 'GeeksforGeeks',
    pattern: /^https?:\/\/(www\.)?geeksforgeeks\.org\/.+$/i,
    template: (u) => `https://www.geeksforgeeks.org/user/${u}`,
    example: 'https://www.geeksforgeeks.org/user/your-username'
  },
  kaggle: {
    label: 'Kaggle',
    pattern: /^https?:\/\/(www\.)?kaggle\.com\/.+$/i,
    template: (u) => `https://www.kaggle.com/${u}`,
    example: 'https://www.kaggle.com/your-username'
  },
  codeforces: {
    label: 'Codeforces',
    pattern: /^https?:\/\/(www\.)?codeforces\.com\/.+$/i,
    template: (u) => `https://codeforces.com/profile/${u}`,
    example: 'https://codeforces.com/profile/your-username'
  },
  codechef: {
    label: 'CodeChef',
    pattern: /^https?:\/\/(www\.)?codechef\.com\/.+$/i,
    template: (u) => `https://www.codechef.com/users/${u}`,
    example: 'https://www.codechef.com/users/your-username'
  },
};

const DEFAULT_ALLOWED = Object.keys(PLATFORM_META);

// -------------------- Utils --------------------
function normalizeInput(key, raw) {
  if (!raw) return '';

  let val = raw.trim();

  // If it already looks like a URL
  if (/^https?:\/\//i.test(val)) {
    return val;
  }

  // Otherwise treat it as username
  if (PLATFORM_META[key]?.template) {
    return PLATFORM_META[key].template(val);
  }

  return val;
}

// -------------------- Routes --------------------

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
  const errors = [];

  for (const key of Object.keys(PLATFORM_META)) {
    if (!allowed.includes(key)) {
      updates[`socialProfiles.${key}`] = ''; // purge if disabled
      continue;
    }

    let raw = (incoming[key] || '').trim();
    if (!raw) {
      updates[`socialProfiles.${key}`] = '';
      continue;
    }

    const fixed = normalizeInput(key, raw);
    const ok = PLATFORM_META[key].pattern.test(fixed);

    if (!ok) {
      errors.push({
        field: key,
        platform: PLATFORM_META[key].label,
        provided: raw,
        normalized: fixed,
        expectedFormat: PLATFORM_META[key].example
      });
      continue;
    }

    updates[`socialProfiles.${key}`] = fixed;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      ok: false,
      msg: 'Some social profile inputs are invalid',
      errors
    });
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
