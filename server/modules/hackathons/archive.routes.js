const express = require('express');
const router = express.Router();
const auth = require('../../core/middlewares/auth'); // Updated path for auth middleware
const Team = require('../teams/team.model');

router.get('/teams', auth, async (req, res) => {
  try {
    const { hackathonId } = req.query;

    const teams = await Team.find({ hackathonId })
      // FIX: Populate photos and emails so they show in the Hall of Fame
      .populate('leader', 'name email photoUrl socialProfiles') 
      .populate('members', 'name email photoUrl socialProfiles')
      // FIX: Populate the Hackathon data to get the real date
      .populate('hackathonId', 'name startDate')
      .sort({ isWinner: -1, winnerPosition: 1 });

    res.json(teams);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;