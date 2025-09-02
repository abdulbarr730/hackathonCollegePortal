const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invitation = require('../models/Invitation');
const User = require('../models/User');

// -------------------- Send an invite --------------------
router.post('/', auth, async (req, res) => {
  const { inviteeId } = req.body;
  const inviterId = req.user._id;

  try {
    const inviter = await User.findById(inviterId);
    if (!inviter.team) {
      return res.status(400).json({ msg: 'You must be in a team to invite' });
    }

    const invitee = await User.findById(inviteeId);
    if (!invitee) return res.status(404).json({ msg: 'Invitee not found' });
    if (invitee.team) return res.status(400).json({ msg: 'User already in a team' });

    // Prevent duplicate invitations
    const existing = await Invitation.findOne({
      team: inviter.team,
      invitee: inviteeId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ msg: 'Invitation already sent to this user' });
    }

    const invitation = new Invitation({
      team: inviter.team,
      inviter: inviterId,
      invitee: inviteeId,
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
      invitee: req.user._id,
      status: 'pending',
    })
      .populate('inviter', 'email')
      .populate('team', 'name');
    res.json(invites);
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

    // Add user to team
    const user = await User.findById(req.user._id);
    if (user.team) {
      return res.status(400).json({ msg: 'You are already in a team' });
    }

    user.team = invite.team;
    await user.save();

    invite.status = 'accepted';
    await invite.save();

    // Reject all other invitations
    await Invitation.updateMany(
      { invitee: req.user._id, _id: { $ne: invite._id } },
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

    if (invite.invitee.toString() !== req.user._id.toString()) {
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
      invitee: req.user._id,
      status: 'pending',
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
