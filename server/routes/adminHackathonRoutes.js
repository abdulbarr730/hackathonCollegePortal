const express = require('express');
const router = express.Router();
const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');
const adminAuth = require('../middleware/adminAuth'); 

// ==========================================
// PUBLIC / USER ROUTES
// ==========================================

// 1. GET ACTIVE HACKATHON
router.get('/active', async (req, res) => {
  try {
    const active = await Hackathon.findOne({ isActive: true });
    
    if (!active) {
      // Fallback if nothing is active
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

// 2. GET ALL HACKATHONS
router.get('/all', adminAuth, async (req, res) => {
  try {
    const hackathons = await Hackathon.find().sort({ createdAt: -1 });
    res.json(hackathons);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// 3. CREATE NEW HACKATHON
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { 
      name, shortName, minTeamSize, maxTeamSize, minFemaleMembers, isActive,
      submissionDeadline 
    } = req.body;
    
    if (isActive) {
      await Hackathon.updateMany({}, { isActive: false });
    }

    const newHackathon = new Hackathon({
      name,
      shortName,
      minTeamSize: minTeamSize || 6, 
      maxTeamSize: maxTeamSize || 6,
      minFemaleMembers: minFemaleMembers || 0,
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
      isActive: !!isActive
    });

    await newHackathon.save();
    res.json(newHackathon);
  } catch (err) {
    console.error(err);
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
    const { 
      name, shortName, minTeamSize, maxTeamSize, minFemaleMembers, 
      submissionDeadline 
    } = req.body;
    
    const updated = await Hackathon.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        shortName, 
        minTeamSize, 
        maxTeamSize, 
        minFemaleMembers,
        submissionDeadline 
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

// 6. MIGRATE LEGACY TEAMS (Utility)
// Use this to fix old teams that don't have a hackathonId
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

// 7. BULK LOCK TEAMS (New: Force Submit all teams for an event)
// Use this for "SIH 2025" to mark everyone as submitted
router.put('/lock-all-teams', adminAuth, async (req, res) => {
  try {
    const { hackathonId } = req.body;
    
    if (!hackathonId) return res.status(400).json({ msg: 'Hackathon ID required' });

    // Mark isSubmitted = true AND clear pending requests
    const result = await Team.updateMany(
      { hackathonId: hackathonId },
      { $set: { isSubmitted: true, pendingRequests: [] } }
    );

    res.json({ msg: `Successfully locked/submitted ${result.modifiedCount} teams.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Bulk lock failed' });
  }
});

// ==========================================
// 8. ADMIN/SPOC: UNLOCK SPECIFIC TEAM
// ==========================================
router.post('/unlock-team/:teamId', adminAuth, async (req, res) => {
  try {
    // Safety: adminAuth middleware handles the check, 
    // but we ensure only high-level users can do this.
    const team = await Team.findById(req.params.teamId);
    
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    team.isSubmitted = false; 
    await team.save();

    res.json({ msg: `Team "${team.teamName}" is now unlocked and editable.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;