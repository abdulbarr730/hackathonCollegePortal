const express = require('express');
const router = express.Router();
const adminAuth = require('../../core/middlewares/adminAuth');
const controller = require('./hackathon.controller');
const jwt = require('jsonwebtoken');
require('../colleges/college.model');
const User = require('../users/user.model');

// Universal Auth Token Extraction Helper
const attachUserIfAvailable = async (req, _res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const userId = decoded.user?.id || decoded.userId || decoded.id || decoded._id;
      if (userId) {
        const user = await User.findById(userId).populate('college');
        if (user) req.user = user;
      }
    }
  } catch (e) {
    // Ignore invalid token on optional public route
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
