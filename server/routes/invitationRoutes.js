const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Invitation = require('../models/Invitation');
const Team = require('../models/Team');
const User = require('../models/User');

// @route   POST /api/invitations/:teamId/:userId
// @desc    Send invitation from leader to user
// @access  Private (leader only)
router.post('/:teamId/:userId', requireAuth, async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId).populate('members');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only leader can send invites
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only leader can send invites' });
    }

    // Check if team already full
    if (team.members.length >= 6) {
      return res.status(400).json({ message: 'Team already has 6 members' });
    }

    // Check if invitee already in a team
    const invitee = await User.findById(userId);
    if (invitee.team) {
      return res.status(400).json({ message: 'User is already in a team' });
    }

    // Prevent duplicate invites
    const existingInvite = await Invitation.findOne({
      teamId,
      inviteeId: userId,
      status: 'pending',
    });
    if (existingInvite) {
      return res.status(400).json({ message: 'Invite already sent to this user' });
    }

    const invitation = new Invitation({
      teamId,
      inviterId: req.user.id,
      inviteeId: userId,
    });

    await invitation.save();
    res.json(invitation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/invitations/:id/accept
// @desc    Accept invitation
// @access  Private
router.post('/:id/accept', requireAuth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

    if (invitation.inviteeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept this invite' });
    }

    const team = await Team.findById(invitation.teamId).populate('members');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findById(req.user.id);

    // --- Same checks as join route ---
    if (user.team) {
      return res.status(400).json({ message: 'You are already in a team' });
    }

    if (team.members.length >= 6) {
      return res.status(400).json({ message: 'Team already has 6 members' });
    }

    const femaleExists = team.members.some((m) => m.gender === 'female');
    const malesCount = team.members.filter((m) => m.gender === 'male').length;

    if (team.members.length === 5 && !femaleExists && user.gender === 'male') {
      return res
        .status(400)
        .json({ message: 'Team must have at least one female member' });
    }

    // --- Add user to team ---
    team.members.push(user._id);
    user.team = team._id;

    await team.save();
    await user.save();

    invitation.status = 'accepted';
    await invitation.save();

    res.json({ message: 'Invitation accepted', team });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/invitations/:id/reject
// @desc    Reject invitation
// @access  Private
router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

    if (invitation.inviteeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to reject this invite' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json({ message: 'Invitation rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/invitations/:id/cancel
// @desc    Cancel an invitation (leader only)
// @access  Private
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

    const team = await Team.findById(invitation.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only leader can cancel invites' });
    }

    await invitation.deleteOne();
    res.json({ message: 'Invitation cancelled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/invitations/sent
// @desc    Get invites sent by current leader
// @access  Private
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const invites = await Invitation.find({ inviterId: req.user.id, status: 'pending' })
      .populate('inviteeId', 'name email');

    res.json(invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/invitations/received
// @desc    Get invites received by current user
// @access  Private
router.get('/received', requireAuth, async (req, res) => {
  try {
    const invites = await Invitation.find({ inviteeId: req.user.id, status: 'pending' })
      .populate('teamId', 'name');

    res.json(invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
