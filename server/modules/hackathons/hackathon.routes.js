const express = require('express');
const router = express.Router();
const adminAuth = require('../../core/middlewares/adminAuth');
const controller = require('./hackathon.controller');
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');

// Optional auth helper to attach user if token exists
const attachUserIfAvailable = async (req, _res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.id || decoded.userId).populate('college');
      if (user) req.user = user;
    }
  } catch (e) {
    // Ignore invalid token on optional route
  }
  next();
};

router.get('/active', attachUserIfAvailable, controller.getActiveHackathon);
router.get('/all', attachUserIfAvailable, controller.listHackathons);

router.post('/create', adminAuth, controller.createHackathon);
router.put('/set-active/:id', adminAuth, controller.setActiveHackathon);
router.put('/update/:id', adminAuth, controller.updateHackathon);
router.delete('/:id', adminAuth, controller.deleteHackathon);
router.delete('/delete/:id', adminAuth, controller.deleteHackathon);

router.put('/migrate-legacy-teams', adminAuth, controller.migrateLegacyTeams);
router.put('/lock-all-teams', adminAuth, controller.lockAllTeams);

module.exports = router;
