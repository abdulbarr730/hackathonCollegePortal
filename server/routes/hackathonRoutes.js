const express = require('express');
const router = express.Router();
const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');
const auth = require('../middleware/auth'); 
const adminAuth = require('../middleware/adminAuth');

// ==========================================
// PUBLIC / USER ROUTES
// ==========================================

// 1. GET ACTIVE HACKATHON
router.get('/active', async (req, res) => {
  try {
    const active = await Hackathon.findOne({ isActive: true });
    if (!active) {
      return res.json({
        title: "Hackathon",
        minTeamSize: 6,
        maxTeamSize: 6,
        minFemaleMembers: 0
      });
    }
    res.json(active);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================

// ==========================================
// 2. GET HACKATHONS (Fixed for Archive Access)
// ==========================================
// REMOVED: adminAuth (So students can see the Archive)
router.get('/all', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // Logic for Archive: Fetch only inactive events
    if (status === 'inactive') {
      query.isActive = false;
    }

    const hackathons = await Hackathon.find(query).sort({ startDate: -1 });
    res.json(hackathons);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});
// 3. CREATE NEW HACKATHON
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { name, startDate, ...rest } = req.body;
    
    if (req.body.isActive) {
      await Hackathon.updateMany({}, { isActive: false });
    }

    const newHackathon = new Hackathon({
      name,
      // FIX: Capture the date from the request, fallback to now
      startDate: startDate || new Date(), 
      ...rest
    });

    await newHackathon.save();
    res.json(newHackathon);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// 4. SET ACTIVE HACKATHON
router.put('/set-active/:id', adminAuth, async (req, res) => {
  try {
    await Hackathon.updateMany({}, { isActive: false });
    const updated = await Hackathon.findByIdAndUpdate(
      req.params.id, 
      { isActive: true }, 
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// 5. UPDATE HACKATHON DETAILS
router.put('/update/:id', adminAuth, async (req, res) => {
  try {
    // FIX: ADD 'startDate' TO THIS LIST
    const { 
      name, shortName, tagline, startDate, submissionDeadline,
      minTeamSize, maxTeamSize, minFemaleMembers 
    } = req.body;
    
    const updated = await Hackathon.findByIdAndUpdate(
      req.params.id,
      { 
        name, shortName, tagline, startDate, submissionDeadline, 
        minTeamSize, maxTeamSize, minFemaleMembers 
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Hackathon not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// 6. MIGRATE LEGACY TEAMS
router.put('/migrate-legacy-teams', adminAuth, async (req, res) => {
  try {
    const { targetHackathonId } = req.body;
    if (!targetHackathonId) return res.status(400).json({ msg: 'Target Hackathon ID required' });
    const result = await Team.updateMany(
      { hackathonId: { $exists: false } }, 
      { $set: { hackathonId: targetHackathonId } }
    );
    res.json({ msg: `Migrated ${result.modifiedCount} legacy teams successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Migration failed' });
  }
});

// ==========================================
// 7. BULK LOCK TEAMS (THE ROUTE YOU WERE MISSING)
// ==========================================
router.put('/lock-all-teams', adminAuth, async (req, res) => {
  try {
    const { hackathonId } = req.body;
    if (!hackathonId) return res.status(400).json({ msg: 'Hackathon ID is required.' });

    const result = await Team.updateMany(
      { hackathonId: hackathonId },
      { $set: { isSubmitted: true, pendingRequests: [] } }
    );

    res.json({ 
      msg: `Successfully locked ${result.modifiedCount} teams for this hackathon.` 
    });
  } catch (err) {
    console.error("Bulk lock error:", err);
    res.status(500).json({ msg: 'Server Error during bulk lock' });
  }
});

module.exports = router;