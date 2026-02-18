const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// =========================================================================
// CONFIGURATION & HELPERS
// =========================================================================

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to upload to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    uploadStream.end(fileBuffer);
  });
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};


// =========================================================================
// CREATE A NEW TEAM (Scoped to Active Hackathon)
// =========================================================================
router.post('/', auth, upload.single('logo'), async (req, res) => {
  const { teamName, problemStatementTitle, problemStatementDescription } = req.body;
  
  if (!teamName) {
    return res.status(400).json({ msg: 'Team name is required.' });
  }

  try {
    // 1. GET ACTIVE HACKATHON
    const activeHackathon = await Hackathon.findOne({ isActive: true });
    if (!activeHackathon) {
        return res.status(400).json({ msg: 'No active hackathon found. Cannot create a team.' });
    }

    const user = await User.findById(req.user.id);

    // 2. SMART CHECK: Is user in a team FOR THIS HACKATHON?
    // We don't trust user.team alone. We check if they are a member of any team linked to this active event.
    const existingTeamForThisEvent = await Team.findOne({
      hackathonId: activeHackathon._id,
      members: req.user.id
    });

    if (existingTeamForThisEvent) {
      return res.status(400).json({ msg: `You are already in team "${existingTeamForThisEvent.teamName}" for the ${activeHackathon.name} event.` });
    }
    
    // 3. CHECK NAME UNIQUENESS (Scoped to this Hackathon)
    // We use collation for case-insensitive search
    const nameTaken = await Team.findOne({ 
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') }, 
      hackathonId: activeHackathon._id 
    });

    if (nameTaken) {
      return res.status(400).json({ msg: `Team name "${teamName}" is already taken in this hackathon.` });
    }

    // 4. CREATE TEAM
    const teamFields = {
      teamName,
      problemStatementTitle,
      problemStatementDescription,
      leader: req.user.id,
      members: [req.user.id],
      hackathonId: activeHackathon._id 
    };

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      teamFields.logoUrl = cloudinaryResult.secure_url;
      teamFields.logoPublicId = cloudinaryResult.public_id;
    }

    let team = new Team(teamFields);
    await team.save();

    // 5. UPDATE USER POINTER
    // We point the user to the NEW team. The old team connection is lost in the User model 
    // but preserved in the Team model (via the 'members' array).
    user.team = team.id;
    await user.save();

    res.status(201).json(team);

  } catch (err) {
    console.error(`Error in POST /api/teams: ${err.message}`);
    // Handle Duplicate Key Error explicitly if race condition occurs
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Team name already exists in this hackathon.' });
    }
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// GET ALL TEAMS (Filtered by Active Hackathon)
// =========================================================================
router.get('/', auth, async (req, res) => {
  try {
    const activeHackathon = await Hackathon.findOne({ isActive: true });
    
    let query = {};
    if (activeHackathon) {
        query.hackathonId = activeHackathon._id;
    } else {
        return res.json([]); // No active event = no public teams shown
    }

    const teams = await Team.find(query)
      .populate('leader', 'name email photoUrl socialProfiles course year')
      .populate('members', 'name email photoUrl socialProfiles course year')
      .populate('pendingRequests', 'name email photoUrl socialProfiles course year');
      
    res.json(teams);
  } catch (err) {
    console.error(`Error in GET /api/teams: ${err.message}`);
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// GET MY TEAM (For the logged-in user)
// =========================================================================
router.get('/my-team', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'team',
      populate: [
        { path: 'members', select: 'name email gender photoUrl socialProfiles course year' },
        { path: 'leader', select: 'name email gender photoUrl socialProfiles course year' },
        { path: 'hackathonId' } // Important: Frontend needs this for rules
      ]
    });

    if (!user.team) return res.json(null);

    res.json(user.team);
  } catch (err) {
    console.error(`Error in GET /api/teams/my-team: ${err.message}`);
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// GET SINGLE TEAM BY ID
// =========================================================================
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email photoUrl socialProfiles course year')
      .populate('members', 'name email photoUrl socialProfiles course year')
      .populate('pendingRequests', 'name email photoUrl socialProfiles course year')
      .populate('hackathonId');

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    console.error(`Error in GET /api/teams/:id: ${err.message}`);
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// UPDATE TEAM DETAILS (Blocked if Submitted)
// =========================================================================
router.put('/:id', auth, upload.single('logo'), async (req, res) => {
  const { teamName, problemStatementTitle, problemStatementDescription } = req.body;
  try {
    let team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Check Lock
    if (team.isSubmitted) {
        return res.status(400).json({ msg: 'Team is submitted and locked. Cannot edit.' });
    }

    if (req.file) {
      if (team.logoPublicId) {
        await deleteFromCloudinary(team.logoPublicId);
      }
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      team.logoUrl = cloudinaryResult.secure_url;
      team.logoPublicId = cloudinaryResult.public_id;
    }

    team.teamName = teamName;
    team.problemStatementTitle = problemStatementTitle;
    team.problemStatementDescription = problemStatementDescription;
    
    await team.save();
    res.json(team);
  } catch (err) {
    console.error(`Error in PUT /api/teams/:id: ${err.message}`);
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// DELETE TEAM (Blocked if Submitted)
// =========================================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Check Lock
    if (team.isSubmitted) {
        return res.status(400).json({ msg: 'Team is submitted and locked. Cannot delete.' });
    }
    
    if (team.logoPublicId) {
      await deleteFromCloudinary(team.logoPublicId);
    }

    await Invitation.deleteMany({ teamId: team._id });
    await User.updateMany({ _id: { $in: team.members } }, { $unset: { team: "" } });
    await team.deleteOne();
    res.json({ msg: 'Team removed' });
  } catch (err) {
    console.error(`Error in DELETE /api/teams/:id: ${err.message}`);
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// JOIN REQUEST (Blocked if Submitted or Full)
// =========================================================================
router.post('/:id/join', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
        .populate('members', 'gender')
        .populate('hackathonId'); 

    if (!team) return res.status(404).json({ msg: 'Team not found' });
    
    if (team.isSubmitted) {
        return res.status(400).json({ msg: 'This team is locked and not accepting new members.' });
    }

    const maxMembers = team.hackathonId ? team.hackathonId.maxTeamSize : 6;

    if (team.members.length >= maxMembers) {
      return res.status(400).json({ msg: `This team is full (Max ${maxMembers} members).` });
    }

    const user = await User.findById(req.user.id);
    if (user.team) {
      return res.status(400).json({ msg: 'You are already in a team.' });
    }
    
    if (team.pendingRequests.map(id => id.toString()).includes(user._id.toString())) {
      return res.status(400).json({ msg: 'You have already sent a request to join this team.' });
    }

    team.pendingRequests.push(req.user.id);
    await team.save();
    res.json(team);

  } catch (err) { 
    console.error(`Error in POST /api/teams/:id/join: ${err.message}`);
    res.status(500).send('Server Error'); 
  }
});


// =========================================================================
// CANCEL JOIN REQUEST
// =========================================================================
router.post('/:id/cancel-request', auth, async (req, res) => {
  try {
    await Team.updateOne(
      { _id: req.params.id },
      { $pull: { pendingRequests: req.user.id } }
    );
    res.json({ ok: true, msg: 'Request cancelled.' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// APPROVE JOIN REQUEST (With Smart Multi-Female Check & Invitation Cleanup)
// =========================================================================
router.post('/:id/approve/:userId', auth, async (req, res) => {
  try {
    const { id: teamId, userId } = req.params;

    const team = await Team.findById(teamId)
        .populate('members', 'gender')
        .populate('hackathonId'); 
        
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    
    if (team.isSubmitted) {
        return res.status(400).json({ msg: 'Team is submitted and locked.' });
    }

    const maxMembers = team.hackathonId ? team.hackathonId.maxTeamSize : 6;
    if (team.members.length >= maxMembers) {
      return res.status(400).json({ msg: `Team is already full (Max ${maxMembers}).` });
    }

    const userToApprove = await User.findById(userId);
    if (!userToApprove || userToApprove.team) {
      await Team.updateOne({ _id: teamId }, { $pull: { pendingRequests: userId } });
      return res.status(400).json({ msg: 'User is no longer available to join.' });
    }

    // --- SMART MULTI-FEMALE RULE CHECK ---
    const requiredFemales = team.hackathonId ? team.hackathonId.minFemaleMembers : 0;
    
    if (requiredFemales > 0) {
        const currentFemales = team.members.filter(m => m.gender && ['female', 'f'].includes(m.gender.toLowerCase())).length;
        const incomingIsFemale = userToApprove.gender && ['female', 'f'].includes(userToApprove.gender.toLowerCase());
        
        const remainingSlots = maxMembers - team.members.length; // Slots left INCLUDING this one
        const femalesStillNeeded = incomingIsFemale ? requiredFemales - (currentFemales + 1) : requiredFemales - currentFemales;

        // If the number of slots left after this approval is EQUAL to the number of females still needed,
        // we MUST block this approval if the user is male.
        if (!incomingIsFemale && (remainingSlots - 1) < femalesStillNeeded) {
             return res.status(400).json({ 
                msg: `Diversity Rule: You still need ${femalesStillNeeded} more female(s) but only have ${remainingSlots - 1} slot(s) left. This slot must be female.` 
             });
        }
    }

    // 1. Update Team Roster
    team.members.push(userId);
    team.pendingRequests = team.pendingRequests.filter(id => id.toString() !== userId);
    await team.save();

    // 2. Update User Profile
    userToApprove.team = teamId;
    await userToApprove.save();

    // 3. THE GHOST-BUSTER FIX:
    // Automatically delete the pending invitation because they are now a member
    await Invitation.deleteMany({ inviteeId: userId, teamId: teamId });

    res.json(team);
  } catch (err) { 
    console.error(`Error in POST /api/teams/:id/approve/:userId: ${err.message}`);
    res.status(500).send('Server Error'); 
  }
});


// =========================================================================
// REJECT JOIN REQUEST
// =========================================================================
router.post('/:id/reject/:userId', auth, async (req, res) => {
  try {
    await Team.updateOne(
      { _id: req.params.id, leader: req.user.id },
      { $pull: { pendingRequests: req.params.userId } }
    );
    res.json({ msg: 'Request rejected.' });
  } catch (err) { 
    res.status(500).send('Server Error'); 
  }
});


// =========================================================================
// LEAVE TEAM (Blocked if Locked)
// =========================================================================
router.delete('/members/leave', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('team').lean();
    if (!user.team) return res.status(400).json({ msg: 'You are not in a team.' });
    
    // Check if team is locked
    const team = await Team.findById(user.team);
    if (team.isSubmitted) {
        return res.status(400).json({ msg: 'Team is locked. You cannot leave.' });
    }

    const result = await Team.updateOne(
        { _id: user.team, leader: { $ne: req.user.id } },
        { $pull: { members: req.user.id } }
    );

    if (result.nModified === 0) {
        if (team.leader.toString() === req.user.id) {
            return res.status(400).json({ msg: 'Team leader cannot leave; delete the team instead.' });
        }
    }
    
    await User.updateOne({ _id: req.user.id }, { $unset: { team: "" } });
    res.json({ msg: 'You have left the team.' });
  } catch (err) {
    console.error(`Error in DELETE /api/teams/members/leave: ${err.message}`);
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// REMOVE MEMBER (Blocked if Locked)
// =========================================================================
// =========================================================================
// REMOVE MEMBER (Matched to Frontend POST request)
// =========================================================================
router.post('/:id/remove/:memberId', auth, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    
    // 1. Leader Protection
    if (req.user.id === memberId) {
        return res.status(400).json({ msg: 'Team leader cannot remove themselves. Delete the team instead.' });
    }

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    
    // 2. Lock Check
    if (team.isSubmitted) return res.status(400).json({ msg: 'Team is locked. Cannot remove members.' });

    // 3. Permission Check (Only leader can remove)
    if (team.leader.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Unauthorized. Only the leader can manage members.' });
    }

    // 4. Update Team & User
    const result = await Team.updateOne(
        { _id: id },
        { $pull: { members: memberId } }
    );

    if (result.modifiedCount === 0) {
        return res.status(400).json({ msg: 'Member not found in this team.' });
    }

    await User.updateOne({ _id: memberId }, { $set: { team: null } });
    
    res.json({ msg: 'Member removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});


// =========================================================================
// REMOVE LOGO (Blocked if Locked)
// =========================================================================
router.delete('/:id/logo', auth, async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    
    if (team.isSubmitted) return res.status(400).json({ msg: 'Team is locked.' });

    if (team.logoPublicId) {
      await deleteFromCloudinary(team.logoPublicId);
    }

    team.logoUrl = '';
    team.logoPublicId = '';
    await team.save();

    res.json(team);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// =========================================================================
// FINAL SUBMIT (LOCK TEAM) - Checks Size & Gender Rules
// =========================================================================
// =========================================================================
// FINAL SUBMIT (LOCK TEAM) - Checks Size, Gender & DEADLINE
// =========================================================================
router.post('/:id/submit', auth, async (req, res) => {
  try {
    // 1. Find team & populate details
    const team = await Team.findById(req.params.id)
      .populate('members', 'gender name') 
      .populate('hackathonId');

    if (!team) return res.status(404).json({ msg: 'Team not found' });

    // 2. Security Checks
    if (team.leader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only the Team Leader can submit.' });
    }
    if (team.isSubmitted) {
      return res.status(400).json({ msg: 'Team is already submitted and locked.' });
    }

    // 3. Get Rules & DEADLINE
    const rules = {
      minMembers: team.hackathonId?.minTeamSize || 1,
      maxMembers: team.hackathonId?.maxTeamSize || 6,
      minFemales: team.hackathonId?.minFemaleMembers || 0,
      deadline: team.hackathonId?.submissionDeadline // <--- Get Deadline
    };

    // --- DEADLINE CHECK START ---
    if (rules.deadline) {
        const now = new Date();
        const deadlineDate = new Date(rules.deadline);
        
        if (now > deadlineDate) {
            return res.status(400).json({ 
                msg: `Submission Closed! The deadline was ${deadlineDate.toLocaleString()}.` 
            });
        }
    }
    // --- DEADLINE CHECK END ---

    // 4. Validate Team Size
    const currentCount = team.members.length;
    if (currentCount < rules.minMembers || currentCount > rules.maxMembers) {
      return res.status(400).json({ 
        msg: `Team size invalid. Must be between ${rules.minMembers} and ${rules.maxMembers} members.` 
      });
    }

    // 5. Validate Gender
    const femaleCount = team.members.filter(m => 
      m.gender && ['female', 'f'].includes(m.gender.toLowerCase())
    ).length;

    if (femaleCount < rules.minFemales) {
      return res.status(400).json({ 
        msg: `Diversity Rule Violation: You need at least ${rules.minFemales} female member(s).` 
      });
    }

    // 6. Lock It
    team.isSubmitted = true;
    team.pendingRequests = []; 
    await team.save();

    res.json({ msg: 'Team submitted successfully!', team });

  } catch (err) {
    console.error(`Error in POST /api/teams/:id/submit: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

module.exports = router;