const express = require('express');
const path = require('path');
const fs = require('fs');
const requireAuth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// This file now ONLY handles the DELETE route
router.delete('/photo', requireAuth, async (req, res) => {
  try {
    const u = await User.findById(req.user._id).select('photoUrl').lean();
    if (u?.photoUrl) {
      const urlObject = new URL(u.photoUrl);
      const relativePath = urlObject.pathname;
      const diskPath = path.join(__dirname, '..', '..', relativePath.replace(/^\/+/, ''));
      fs.unlink(diskPath, () => {});
    }
    await User.findByIdAndUpdate(req.user._id, { $set: { photoUrl: '' } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Delete failed' });
  }
});

module.exports = router;