const service = require('./hackathon.service');

exports.getActiveHackathon = async (req, res) => {
  try {
    const collegeId = req.query.collegeId || req.user?.college?._id || req.user?.college;
    const data = await service.getActiveHackathon(collegeId);
    res.json(data);
  } catch (err) {
    console.error('Active hackathon error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.listHackathons = async (req, res) => {
  try {
    const data = await service.listHackathons(req.query, req.user);
    res.json(data);
  } catch (err) {
    console.error('List hackathons error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.createHackathon = async (req, res) => {
  try {
    const hackathon = await service.createHackathon(req.body, req.user);
    res.json(hackathon);
  } catch (err) {
    console.error('Create hackathon error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.setActiveHackathon = async (req, res) => {
  try {
    const hackathon = await service.setActiveHackathon(req.params.id, req.user);
    res.json(hackathon);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

exports.updateHackathon = async (req, res) => {
  try {
    const hackathon = await service.updateHackathon(req.params.id, req.body, req.user);
    res.json(hackathon);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

exports.deleteHackathon = async (req, res) => {
  try {
    await service.deleteHackathon(req.params.id, req.user);
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

exports.migrateLegacyTeams = async (_req, res) => {
  try {
    const data = await service.migrateLegacyTeams();
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.lockAllTeams = async (req, res) => {
  try {
    const { hackathonId } = req.body;
    const data = await service.lockAllTeams(hackathonId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
