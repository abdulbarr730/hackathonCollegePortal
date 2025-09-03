// routes/teamRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');

// -------------------- Create a Team --------------------
router.post('/', auth, async (req, res) => {
  const { teamName, problemStatementTitle, problemStatementDescription } = req.body;
  if (!teamName) {
    return res.status(400).json({ msg: 'Team name is required.' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (user.team) {
      return res.status(400).json({ msg: 'You are already in a team.' });
    }
    let team = await Team.findOne({ teamName });
    if (team) {
      return res.status(400).json({ msg: 'Team name is already taken.' });
    }
    team = new Team({
      teamName,
      problemStatementTitle,
      problemStatementDescription,
      leader: req.user.id,
      members: [req.user.id],
    });
    await team.save();
    user.team = team.id;
    await user.save();
    res.status(201).json(team);
  } catch (err) {
    console.error(`Error in POST /api/teams: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// -------------------- GET all teams --------------------
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leader', 'name email photoUrl socialProfiles nameWithYear year')
      .populate('members', 'name email photoUrl socialProfiles nameWithYear year')
      .populate('pendingRequests', 'name email photoUrl socialProfiles nameWithYear year');
    res.json(teams);
  } catch (err) {
    console.error(`Error in GET /api/teams: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// -------------------- GET my team for logged-in user --------------------
router.get('/my-team', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'team',
      populate: [
        { path: 'members', select: 'name email gender' },
        { path: 'leader', select: 'name email gender' }
      ]
    });

    if (!user.team) return res.json(null);

    res.json(user.team);
  } catch (err) {
    console.error(`Error in GET /api/teams/my-team: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// -------------------- GET a single team by ID --------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email photoUrl socialProfiles nameWithYear year')
      .populate('members', 'name email photoUrl socialProfiles nameWithYear year')
      .populate('pendingRequests', 'name email photoUrl socialProfiles nameWithYear year');

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    console.error(`Error in GET /api/teams/:id: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// -------------------- Edit a team's details --------------------
router.put('/:id', auth, async (req, res) => {
  const { teamName, problemStatementTitle, problemStatementDescription } = req.body;
  try {
    let team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
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

// -------------------- Delete a team --------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await User.updateMany({ _id: { $in: team.members } }, { $unset: { team: "" } });
    await team.deleteOne();
    res.json({ msg: 'Team removed' });
  } catch (err) {
    console.error(`Error in DELETE /api/teams/:id: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// -------------------- Request to join a team --------------------
router.post('/:id/join', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members', 'gender');
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    if (team.members.length >= 6) {
      return res.status(400).json({ msg: 'This team is already full.' });
    }

    const user = await User.findById(req.user.id);
    if (user.team) {
      return res.status(400).json({ msg: 'You are already in a team.' });
    }
    
    if (team.pendingRequests.map(id => id.toString()).includes(user._id.toString())) {
      return res.status(400).json({ msg: 'You have already sent a request to join this team.' });
    }

    if (team.members.length === 5) {
      const hasFemale = team.members.some(member => member.gender === 'Female');
      if (!hasFemale && user.gender !== 'Female') {
          return res.status(400).json({ msg: 'A team of 6 must have at least one female member.' });
      }
    }
    
    team.pendingRequests.push(req.user.id);
    await team.save();
    res.json(team);

  } catch (err) { 
    console.error(`Error in POST /api/teams/:id/join: ${err.message}`);
    res.status(500).send('Server Error'); 
  }
});

// -------------------- Cancel a join request --------------------
router.post('/:id/cancel-request', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).select('pendingRequests members').lean();
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    if (team.members?.some(m => m.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'You are already a member of this team.' });
    }

    await Team.updateOne(
      { _id: req.params.id },
      { $pull: { pendingRequests: req.user.id } }
    );

    res.json({ ok: true, msg: 'Request cancelled.' });
  } catch (err) {
    console.error(`Error in POST /api/teams/:id/cancel-request: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// -------------------- Approve a join request --------------------
router.post('/:id/approve/:userId', auth, async (req, res) => {
    try {
        const { id: teamId, userId } = req.params;

        const userToApprove = await User.findById(userId);
        if (!userToApprove || userToApprove.team) {
            await Team.updateOne({ _id: teamId }, { $pull: { pendingRequests: userId } });
            return res.status(400).json({ msg: 'User is no longer available to join.' });
        }
        
        const updatedTeam = await Team.findOneAndUpdate(
            {
                _id: teamId,
                leader: req.user.id,
                $expr: { $lt: [{ $size: '$members' }, 6] },
                pendingRequests: userId,
            },
            {
                $push: { members: userId },
                $pull: { pendingRequests: userId },
            },
            { new: true }
        );

        if (!updatedTeam) {
            return res.status(400).json({ msg: 'Could not approve request. Team might be full, user is not pending, or you are not the leader.' });
        }

        userToApprove.team = teamId;
        await userToApprove.save();

        res.json(updatedTeam);
    } catch (err) { 
        console.error(`Error in POST /api/teams/:id/approve/:userId: ${err.message}`);
        res.status(500).send('Server Error'); 
    }
});

// -------------------- Reject a join request --------------------
router.post('/:id/reject/:userId', auth, async (req, res) => {
    try {
        const result = await Team.updateOne(
            { _id: req.params.id, leader: req.user.id },
            { $pull: { pendingRequests: req.params.userId } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ msg: 'Team not found or user not authorized' });
        }
        res.json({ msg: 'Request rejected.' });
    } catch (err) { 
        console.error(`Error in POST /api/teams/:id/reject/:userId: ${err.message}`);
        res.status(500).send('Server Error'); 
    }
});

// -------------------- Leave the current team --------------------
router.delete('/members/leave', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('team').lean();
    if (!user.team) {
      return res.status(400).json({ msg: 'You are not in a team.' });
    }
    
    const result = await Team.updateOne(
        { _id: user.team, leader: { $ne: req.user.id } },
        { $pull: { members: req.user.id } }
    );

    if (result.nModified === 0) {
        const team = await Team.findById(user.team).select('leader').lean();
        if (!team) return res.json({ msg: 'Team not found, but your record is clear.' });
        if (team.leader.toString() === req.user.id) {
            return res.status(400).json({ msg: 'Team leader cannot leave; you must delete the team instead.' });
        }
    }
    
    await User.updateOne({ _id: req.user.id }, { $unset: { team: "" } });
    res.json({ msg: 'You have left the team.' });
  } catch (err) {
    console.error(`Error in DELETE /api/teams/members/leave: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// -------------------- Remove a member from a team --------------------
router.delete('/:teamId/members/:memberId', auth, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    
    if (req.user.id === memberId) {
        return res.status(400).json({ msg: 'Team leader cannot remove themselves.' });
    }

    const result = await Team.updateOne(
        { _id: teamId, leader: req.user.id },
        { $pull: { members: memberId } }
    );

    if (result.nModified === 0) {
        return res.status(404).json({ msg: 'Team not found, member not found, or you are not the leader.' });
    }

    await User.updateOne({ _id: memberId }, { $unset: { team: "" } });
    res.json({ msg: 'Member removed.' });
  } catch (err) {
    console.error(`Error in removing member: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
