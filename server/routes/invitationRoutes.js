const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Team = require('../models/Team');

// -------------------- Send an invite --------------------
router.post('/', auth, async (req, res) => {
  const { inviteeId } = req.body;
  const inviterId = req.user._id;

  try {
    // Fetch inviter with team info
    const inviter = await User.findById(inviterId).select('team');
    if (!inviter.team) {
      return res.status(400).json({ msg: 'You must be in a team to invite' });
    }

    const invitee = await User.findById(inviteeId).select('team');
    if (!invitee) return res.status(404).json({ msg: 'Invitee not found' });
    if (invitee.team) return res.status(400).json({ msg: 'User already in a team' });

    // Prevent duplicate invitations
    const existing = await Invitation.findOne({
      teamId: inviter.team,
      inviteeId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ msg: 'Invitation already sent to this user' });
    }

    const invitation = new Invitation({
      teamId: inviter.team,
      inviterId,
      inviteeId,
    });

    await invitation.save();
    res.json(invitation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// -------------------- Get invitations for current user --------------------
router.get('/me', auth, async (req, res) => {
  try {
    const invites = await Invitation.find({
      inviteeId: req.user._id,
      status: 'pending',
    })
      .populate('inviterId', 'name email photoUrl')
      .populate({
        path: 'teamId',
        select: 'teamName problemStatementTitle leader members',
        populate: { path: 'leader', select: 'name email photoUrl' },
      });

    // Map to include membersCount and leader info
    const formattedInvites = invites.map((invite) => ({
      _id: invite._id,
      status: invite.status,
      inviter: invite.inviterId,
      team: {
        _id: invite.teamId._id,
        teamName: invite.teamId.teamName,
        problemStatementTitle: invite.teamId.problemStatementTitle,
        membersCount: invite.teamId.members.length,
        leader: invite.teamId.leader,
      },
      createdAt: invite.createdAt,
    }));

    res.json(formattedInvites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// -------------------- Accept an invitation --------------------
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ msg: 'Invitation not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.team) {
      return res.status(400).json({ msg: 'You are already in a team' });
    }

    // Add user to the team
    const team = await Team.findById(invite.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    team.members.push(user._id);
    await team.save();

    user.team = team._id;
    await user.save();

    // Update invitation status
    invite.status = 'accepted';
    await invite.save();

    // Reject all other pending invitations
    await Invitation.updateMany(
      { inviteeId: req.user._id, _id: { $ne: invite._id } },
      { status: 'rejected' }
    );

    res.json({ msg: 'Invitation accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// -------------------- Reject an invitation --------------------
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ msg: 'Invitation not found' });
    }

    if (invite.inviteeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    invite.status = 'rejected';
    await invite.save();

    res.json({ msg: 'Invitation rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// -------------------- Get pending invitations count --------------------
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Invitation.countDocuments({
      inviteeId: req.user._id,
      status: 'pending',
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
