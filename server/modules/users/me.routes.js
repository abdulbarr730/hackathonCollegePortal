const express = require('express');
const auth = require('../../core/middlewares/auth');
const User = require('./user.model');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const u = await User.findById(req.user.id)
      .select('name photoUrl mustAddPhone')
      .lean();
    if (!u) {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.json({
      _id: String(u._id),
      name: u.name,
      photoUrl: u.photoUrl || '',
      mustAddPhone: u.mustAddPhone
    });
  } catch (error) {
    console.error('Error fetching /api/me:', error);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;