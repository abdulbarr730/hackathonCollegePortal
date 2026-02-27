const express = require('express');
const router = express.Router();
const auth = require('../../core/middlewares/auth');
const Invitation = require('./invitation.model');
const Team = require('./team.model');
const User = require('../users/user.model');
const Hackathon = require('../hackathons/hackathon.model');

// =============================================================================
// 1. SEND INVITATION
// =============================================================================
router.post('/', auth, async (req, res) => {
  const { teamId, inviteeId } = req.body;

  try {
    // A. Validate Team & Permissions
    const team = await Team.findById(teamId).populate('hackathonId');
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    if (team.leader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only the Team Leader can send invites.' });
    }

    if (team.isSubmitted) {
       return res.status(400).json({ msg: 'Team is locked. Cannot invite new members.' });
    }

    // B. Check Dynamic Team Limits
    const maxMembers = team.hackathonId ? team.hackathonId.maxTeamSize : 6;
    const currentMembers = team.members.length;
    
    // Count ONLY pending invites to see if slots are reserved
    const pendingInvites = await Invitation.countDocuments({ teamId: team._id, status: 'pending' });

    if (currentMembers + pendingInvites >= maxMembers) {
      return res.status(400).json({ 
        msg: `Team limit reached! (${currentMembers} joined + ${pendingInvites} invited = ${currentMembers + pendingInvites}/${maxMembers})` 
      });
    }

    // C. Validate Invitee
    const invitee = await User.findById(inviteeId).populate('team'); // Populate to check their current status
    if (!invitee) return res.status(404).json({ msg: 'User not found' });

    // D. "Smart Check": Is Invitee already in a team FOR THIS HACKATHON?
    if (invitee.team) {
       // If the user has a team, we must check if it belongs to the ACTIVE event.
       // If it's an old team from last year, we ignore it.
       const activeHackathon = await Hackathon.findOne({ isActive: true });
       
       if (activeHackathon) {
          // We need to fetch the invitee's team details to check its hackathonId
          // (Since invitee.team might just be an ID if not fully populated deep enough)
          const inviteeTeam = await Team.findById(invitee.team._id || invitee.team);
          
          if (inviteeTeam && inviteeTeam.hackathonId.toString() === activeHackathon._id.toString()) {
             return res.status(400).json({ msg: 'User is already in a team for this active event.' });
          }
       }
    }

    // E. Prevent Duplicate Invites
    const existingInvite = await Invitation.findOne({
      teamId: team._id,
      inviteeId: invitee._id,
      status: 'pending'
    });
    if (existingInvite) {
      return res.status(400).json({ msg: 'Invitation already sent to this user.' });
    }

    // F. Create Invitation
    const invitation = new Invitation({
      inviter: req.user.id,
      inviteeId,
      teamId,
      status: 'pending'
    });

    await invitation.save();
    res.json(invitation);

  } catch (err) {
    console.error("Send Invite Error:", err);
    res.status(500).send('Server Error');
  }
});


// =============================================================================
// 2. GET SENT INVITES (For Team Leader)
// =============================================================================
router.get('/sent', auth, async (req, res) => {
  try {
    // Find the active team led by this user
    // (We sort by createdAt desc to get the most recent one if multiple exist, though validation prevents that)
    const team = await Team.findOne({ leader: req.user.id }).sort({ createdAt: -1 });
    
    if (!team) return res.json([]);

    const invites = await Invitation.find({ teamId: team._id, status: 'pending' })
      .populate('inviteeId', 'name email photoUrl course year');
    
    res.json(invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// =============================================================================
// 3. GET RECEIVED INVITES (For User)
// =============================================================================
router.get('/my-invitations', auth, async (req, res) => {
  try {
    const invites = await Invitation.find({ inviteeId: req.user.id, status: 'pending' })
      .populate({
         path: 'teamId',
         select: 'teamName',
         populate: { path: 'leader', select: 'name' }
      });
    res.json(invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// =============================================================================
// 4. CANCEL INVITATION (Delete)
// =============================================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite) return res.status(404).json({ msg: 'Invitation not found' });

    // Allow deletion if user is the Inviter (Leader) OR the Invitee
    if (invite.inviter.toString() !== req.user.id && invite.inviteeId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to cancel this invite.' });
    }

    await invite.deleteOne();
    res.json({ msg: 'Invitation removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// =============================================================================
// 5. ACCEPT INVITATION (With Smart Gender Check & Global Purge)
// =============================================================================
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ msg: 'Invitation not found' });

    if (invitation.inviteeId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const team = await Team.findById(invitation.teamId)
        .populate('members', 'gender')
        .populate('hackathonId');

    if (!team) {
       await invitation.deleteOne();
       return res.status(404).json({ msg: 'Team no longer exists.' });
    }

    // A. Team Size Check
    const maxMembers = team.hackathonId ? team.hackathonId.maxTeamSize : 6;
    if (team.members.length >= maxMembers) {
      await invitation.deleteOne(); // Cleanup stale invite
      return res.status(400).json({ msg: 'Team is now full.' });
    }

    // B. SMART MULTI-FEMALE RULE CHECK
    const requiredFemales = team.hackathonId ? team.hackathonId.minFemaleMembers : 0;
    const user = await User.findById(req.user.id);

    if (requiredFemales > 0) {
        const currentFemales = team.members.filter(m => m.gender && ['female', 'f'].includes(m.gender.toLowerCase())).length;
        const incomingIsFemale = user.gender && ['female', 'f'].includes(user.gender.toLowerCase());
        
        const remainingSlots = maxMembers - team.members.length; // Slots left INCLUDING this one
        const femalesStillNeeded = incomingIsFemale ? requiredFemales - (currentFemales + 1) : requiredFemales - currentFemales;

        // If user is male and joining would leave too few slots to meet the female requirement
        if (!incomingIsFemale && (remainingSlots - 1) < femalesStillNeeded) {
             return res.status(400).json({ 
                msg: `Diversity Rule: This team still needs ${femalesStillNeeded} more female(s) but only has ${remainingSlots - 1} slot(s) left after you. Cannot join.` 
             });
        }
    }

    // 1. Join Team
    team.members.push(req.user.id);
    // Clear user from any pending join requests they might have sent elsewhere
    team.pendingRequests = team.pendingRequests.filter(rid => rid.toString() !== req.user.id);
    await team.save();

    // 2. Update User Profile
    user.team = team._id;
    await user.save();

    // 3. THE GLOBAL GHOST-BUSTER FIX:
    // User is now officially in a team. Wipe EVERY invitation involving them.
    // This cleans up your "Awaiting response" list in the dashboard.
    await Invitation.deleteMany({ 
      $or: [
        { inviteeId: req.user.id }, // Invites they received
        { inviter: req.user.id }    // Invites they sent (if they were a leader elsewhere)
      ]
    });

    res.json({ msg: 'Joined team successfully and cleared other invites!', teamId: team._id });

  } catch (err) {
    console.error("Accept Invite Error:", err);
    res.status(500).send('Server Error');
  }
});


// =============================================================================
// 6. REJECT INVITATION (Full Cleanup)
// =============================================================================
router.post('/:id/reject', auth, async (req, res) => {
  try {
    // 1. Find the invitation
    const invitation = await Invitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({ msg: 'Invitation not found' });
    }

    // 2. Security: Only the intended invitee can reject it
    if (invitation.inviteeId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to reject this invitation.' });
    }

    // 3. Delete the invitation immediately
    // We use deleteOne instead of just changing status to 'rejected' 
    // to free up team slots and keep the database clean.
    await invitation.deleteOne();

    res.json({ msg: 'Invitation rejected and removed.' });

  } catch (err) {
    console.error(`Error in POST /api/invitations/:id/reject: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

module.exports = router;